const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Job = require('../models/Job');
const { protect } = require('../middleware/authMiddleware');
const https = require('https'); // For Expo Push

// @desc    Obtener chats del usuario
// @route   GET /api/chats
router.get('/', protect, async (req, res) => {
    try {
        // 1. Obtener los chats con proyección optimizada (solo el último mensaje)
        let chats = await Chat.find({ participants: req.user._id })
            .select('_id job participants lastMessage lastMessageDate')
            .populate('participants', 'name avatar email role')
            .populate('job', 'title client')
            .slice('messages', -1) // Traer solo el ÚLTIMO mensaje en el array messages
            .sort({ lastMessageDate: -1 })
            .lean();

        // 2. Calcular unreadCount para todos los chats en UNA sola consulta de agregación
        const unreadCounts = await Chat.aggregate([
            { $match: { participants: req.user._id } },
            { $unwind: '$messages' },
            { $match: { 'messages.read': false, 'messages.sender': { $ne: req.user._id } } },
            { $group: { _id: '$_id', count: { $sum: 1 } } }
        ]);

        const unreadMap = {};
        unreadCounts.forEach(u => {
            unreadMap[u._id.toString()] = u.count;
        });

        // 3. Regla: todo chat debe estar vinculado a una Solicitud y formatear
        const role = (req.query.role || '').toLowerCase();

        let processedChats = chats.filter(c => !!c.job).map(c => {
            return {
                ...c,
                unreadCount: unreadMap[c._id.toString()] || 0
            };
        });

        // --- FILTRO POR ROL (Estricto) ---
        if (role === 'client') {
            processedChats = processedChats.filter(c => {
                const clientId = c.job && c.job.client ? (c.job.client._id || c.job.client) : null;
                return clientId && String(clientId) === String(req.user._id);
            });
        } else if (role === 'pro') {
            processedChats = processedChats.filter(c => {
                const clientId = c.job && c.job.client ? (c.job.client._id || c.job.client) : null;
                const meId = String(req.user._id);
                // Si soy el cliente del trabajo, no es mi chat de pro
                if (clientId && String(clientId) === meId) return false;
                // Si participo como cliente, tampoco
                const me = (c.participants || []).find(p => String(p._id) === meId);
                if (me && me.role && String(me.role).toLowerCase() === 'client') return false;
                return true;
            });
        }

        res.json(processedChats);
    } catch (error) {
        console.error("[GET /api/chats] Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener un chat específico o crear uno si no existe
// @route   POST /api/chats
router.post('/', protect, async (req, res) => {
    const { targetUserId, jobId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ message: 'Target user ID is required' });
    }

    try {
        console.log(`[POST /chats] Request From: ${req.user._id}, To: ${targetUserId}, Job: ${jobId || 'NONE'}`);

        // VALIDACIÓN: El jobId es obligatorio para separar conversaciones por solicitud (Regla #4)
        if (!jobId) {
            console.error(`[POST /chats] Missing JobId`);
            return res.status(400).json({ message: 'Se requiere el ID de la solicitud para iniciar un chat.' });
        }

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            console.error(`[POST /chats] Invalid JobId received: ${jobId}`);
            return res.status(400).json({ message: 'El ID de la solicitud no es válido.' });
        }

        // Validar participantes contra cliente del trabajo
        const job = await Job.findById(jobId).select('client');
        if (!job) {
            console.error(`[POST /chats] Job not found: ${jobId}`);
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        const jobClientIdStr = job.client.toString();
        const meStr = req.user._id.toString();
        const targetStr = targetUserId.toString();
        const iAmClient = meStr === jobClientIdStr;
        const targetIsClient = targetStr === jobClientIdStr;
        if (iAmClient ? targetIsClient : !targetIsClient) {
            console.error(`[POST /chats] Invalid participants for job ${jobId}. me=${meStr} target=${targetStr} jobClient=${jobClientIdStr}`);
            return res.status(400).json({ message: 'El chat debe ser entre el cliente de la solicitud y el otro participante.' });
        }

        // Buscar chat existente específico para este trabajo
        let query = {
            participants: { $all: [req.user._id, targetUserId] },
            job: jobId
        };

        let chat = await Chat.findOne(query).populate('participants', 'name avatar');

        if (chat) {
            console.log(`[POST /chats] Found existing chat: ${chat._id} for Job: ${jobId}`);
            return res.json(chat);
        }

        console.log(`[POST /chats] Creating NEW chat for Job: ${jobId}`);
        // Crear nuevo chat
        const newChat = new Chat({
            participants: [req.user._id, targetUserId],
            job: jobId,
            messages: []
        });

        const savedChat = await newChat.save();

        // LINK CHAT TO JOB
        if (jobId) {
            await Job.findByIdAndUpdate(jobId, { $addToSet: { conversations: savedChat._id } });
        }

        const populatedChat = await Chat.findById(savedChat._id).populate('participants', 'name avatar');

        res.status(201).json(populatedChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener detalles de un chat
// @route   GET /api/chats/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
            .populate('participants', 'name avatar')
            .populate('messages.sender', 'name avatar');

        if (!chat) return res.status(404).json({ message: 'Chat no encontrado' });

        if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Enviar mensaje
// @route   POST /api/chats/:id/messages
router.post('/:id/messages', protect, async (req, res) => {
    const { content, media } = req.body;
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: 'Chat no encontrado' });

        // Verificar participación
        const isParticipant = chat.participants.some(p => {
            const pid = p._id ? p._id.toString() : p.toString();
            return pid === req.user._id.toString();
        });

        if (!isParticipant) {
            console.error(`[POST /messages] Unauthorized for user ${req.user._id} in chat ${chat._id}`);
            return res.status(403).json({ message: 'No autorizado' });
        }

        const newMessage = {
            sender: req.user._id,
            content,
            media,
            createdAt: new Date()
        };

        // OPTIMIZACIÓN CRÍTICA: No cargar todo el chat. Usar $push directo.
        const updatedChat = await Chat.findByIdAndUpdate(
            req.params.id,
            {
                $push: { messages: newMessage },
                $set: {
                    lastMessage: content || (media ? "Imagen enviada" : ""),
                    lastMessageDate: new Date()
                }
            },
            {
                new: true, // Devolver el doc actualizado
                select: { messages: { $slice: -1 } }, // Solo queremos el último mensaje
                lean: true
            }
        );

        if (!updatedChat) return res.status(500).json({ message: 'Error actualizando chat' });

        const latestMessage = updatedChat.messages[updatedChat.messages.length - 1];

        // Perform background tasks (Push, Socket) without blocking the response as much
        (async () => {
            // NOTIFICACIONES PUSH (Expo)
            const receiverId = chat.participants.find(p => {
                const pid = p._id ? p._id.toString() : p.toString();
                return pid !== req.user._id.toString();
            });
            if (receiverId) {
                const receiverUser = await User.findById(receiverId).select('pushToken');
                if (receiverUser && receiverUser.pushToken) {
                    try {
                        const pushBody = {
                            to: receiverUser.pushToken,
                            sound: 'default',
                            title: req.user.name,
                            body: content,
                            data: { chatId: chat._id, jobId: chat.job }
                        };

                        const data = JSON.stringify(pushBody);
                        const options = {
                            hostname: 'exp.host',
                            path: '/--/api/v2/push/send',
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': data.length,
                            },
                        };

                        const reqPush = https.request(options, (resPush) => { });
                        reqPush.on('error', (e) => console.error("Push Error:", e));
                        reqPush.write(data);
                        reqPush.end();

                    } catch (pushErr) {
                        console.error("Push Notification Failed:", pushErr);
                    }
                }
            }

            // SOCKET.IO REAL-TIME UPDATE
            const io = req.app.get('socketio');
            if (io) {
                let senderRole = 'pro';
                try {
                    const jobForRole = await Job.findById(chat.job).select('client');
                    if (jobForRole && jobForRole.client.toString() === req.user._id.toString()) {
                        senderRole = 'client';
                    }
                } catch (err) {
                    console.error("[Socket] Error determining role:", err);
                }

                io.to(req.params.id).emit('receive_message', {
                    chatId: req.params.id,
                    message: {
                        id: latestMessage._id,
                        text: content,
                        sender: senderRole,
                        _id: latestMessage._id,
                        content: content,
                        senderId: req.user._id,
                        createdAt: latestMessage.createdAt,
                        media: media
                    }
                });
            }
        })();

        // Devolver SOLO el mensaje creado (Mucho más rápido)
        res.json({
            success: true,
            message: {
                _id: latestMessage._id,
                content: latestMessage.content || "",
                sender: req.user._id,
                createdAt: latestMessage.createdAt,
                media: latestMessage.media
            }
        });
    } catch (error) {
        console.error("[POST /messages] Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Marcar mensajes como leídos
// @route   PUT /api/chats/:id/read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: 'Chat no encontrado' });

        // Verificar participación
        if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Marcar como leídos todos los mensajes donde el remitente NO es el usuario actual
        let changed = false;
        chat.messages.forEach(m => {
            if (m.sender.toString() !== req.user._id.toString() && !m.read) {
                m.read = true;
                changed = true;
            }
        });

        if (changed) {
            await chat.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
