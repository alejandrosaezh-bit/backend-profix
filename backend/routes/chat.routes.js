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
        let chats = await Chat.find({ participants: req.user._id })
            .select('-messages') // OPTIMIZATION: Don't fetch full history for list view
            .populate('participants', 'name avatar email role')
            .populate('job', 'title client')
            .sort({ lastMessageDate: -1 })
            .lean(); // OPTIMIZATION: Plain JS objects

        // Regla: todo chat debe estar vinculado a una Solicitud
        chats = chats.filter(c => !!c.job);

        // --- FILTRO POR ROL (Estricto) ---
        // Separar chats de Cliente vs Profesional
        const role = (req.query.role || '').toLowerCase();

        if (role === 'client') {
            // MOSTRAR: Solo chats donde SOY EL DUEÑO de la solicitud
            chats = chats.filter(c => {
                const clientId = c.job && c.job.client ? (c.job.client._id || c.job.client) : null;
                const meId = String(req.user._id);
                // Debe tener Job y Client, y CLIENT == YO
                return clientId && String(clientId) === meId;
            });
        } else if (role === 'pro') {
            // MOSTRAR: Solo chats donde yo NO soy el dueño (soy el profesional/postulante)
            chats = chats.filter(c => {
                try {
                    const clientId = c.job && c.job.client ? (c.job.client._id || c.job.client) : null;
                    const meId = String(req.user._id);

                    // 1) Si yo soy el cliente del trabajo -> OCULTAR (es mi chat de cliente)
                    if (clientId && String(clientId) === meId) return false;

                    // 2) Seguridad extra: Si yo participo con rol 'client' -> OCULTAR
                    const me = (c.participants || []).find(p => String(p._id) === meId);
                    if (me && me.role && String(me.role).toLowerCase() === 'client') return false;

                    return true;
                } catch (e) {
                    return false; // Si hay error en estructura, ocultar por seguridad
                }
            });
        }

        // LOGS TEMPORALES (Debug)
        try {
            const summary = chats.slice(0, 5).map(c => ({
                chatId: c._id,
                jobId: c.job?._id || c.job,
                jobClient: c.job?.client?._id || c.job?.client,
                participants: (c.participants || []).map(p => ({ id: p._id, name: p.name, role: p.role }))
            }));
            console.log(`[GET /api/chats] role=${role} user=${req.user._id} count=${chats.length}`);
            console.log(`[GET /api/chats] sample=`, JSON.stringify(summary));
        } catch (logErr) { }

        res.json(chats);
    } catch (error) {
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
        if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const newMessage = {
            sender: req.user._id,
            content,
            media
        };

        chat.messages.push(newMessage);
        chat.lastMessage = content || (media ? "Imagen enviada" : "");
        chat.lastMessageDate = Date.now();

        await chat.save();

        // NOTIFICACIONES PUSH (Expo)
        const receiverId = chat.participants.find(p => p._id.toString() !== req.user._id.toString())?._id;
        if (receiverId) {
            const receiverUser = await User.findById(receiverId);
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

        // Devolver el chat actualizado
        const updatedChat = await Chat.findById(req.params.id)
            .populate('participants', 'name avatar')
            .populate('messages.sender', 'name avatar');

        // SOCKET.IO REAL-TIME UPDATE
        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.id).emit('receive_message', {
                chatId: req.params.id,
                message: {
                    id: newMessage._id ? newMessage._id.toString() : 'temp-' + Date.now(),
                    text: content,
                    sender: isActingAsPro ? 'pro' : 'client', // Map correctly based on role logic if needed, or send raw ID
                    // Better: send the raw message object so frontend can map it
                    _id: newMessage._id || Date.now(),
                    content: content,
                    senderId: req.user._id,
                    createdAt: new Date(),
                    media: media
                }
            });
            console.log(`[Socket] Emitted receive_message to room ${req.params.id}`);
        } else {
            console.error('[Socket] IO instance not found in request');
        }

        res.json(updatedChat);
    } catch (error) {
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
