const express = require('express');
const router = express.Router();
const https = require('https'); // For Push Notifications
const jwt = require('jsonwebtoken');
const Job = require('../models/Job');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Category = require('../models/Category');
const JobInteraction = require('../models/JobInteraction');
const Review = require('../models/Review');
const { protect } = require('../middleware/authMiddleware');

// --- PUSH NOTIFICATION HELPER ---
const sendPushNotification = async (pushToken, title, body, data = {}) => {
    if (!pushToken) return;

    const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    const dataString = JSON.stringify([message]); // Expo expects array

    const options = {
        hostname: 'exp.host',
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Length': dataString.length,
        },
    };

    try {
        const req = https.request(options, (res) => {
            res.on('data', (d) => {
                // process.stdout.write(d); // Optional log
            });
        });

        req.on('error', (e) => {
            console.error('Error sending push notification:', e);
        });

        req.write(dataString);
        req.end();
    } catch (e) {
        console.error("Exception sending push:", e);
    }
};

// --- HELPER STATUS CALCULATOR ---
const calculateJobStatuses = (job, userId) => {
    const userIdStr = userId.toString();

    // ---- CLIENT STATUS ----
    let clientStatus = 'NUEVA';

    // 1. CANCELED
    if (job.status === 'canceled') clientStatus = 'ELIMINADA';
    // 2. TERMINADO (Rated, Completed, or Client explicitly finished)
    else if (job.status === 'rated' || job.status === 'completed' || job.status === 'Culminada' || job.clientFinished) clientStatus = 'TERMINADO';
    // 3. VALIDATING (Pro finished, Client pending)
    else if (job.proFinished && !job.clientFinished) clientStatus = 'VALIDANDO';
    // 4. IN PROGRESS (Started)
    else if (job.status === 'in_progress' && job.trackingStatus === 'started') clientStatus = 'EN EJECUCIÓN';
    // 5. ACCEPTED (Contracted but not started)
    else if (job.status === 'in_progress' || (job.offers && job.offers.some(o => o.status === 'accepted'))) clientStatus = 'ACEPTADO';
    // 6. OFFERS
    else if (job.offers && job.offers.some(o => o.status === 'pending')) clientStatus = 'PRESUPUESTADA';
    // 7. CONTACTED
    else if ((job.conversations && job.conversations.length > 0) || (job.interactionsSummary && job.interactionsSummary.contacted > 0)) clientStatus = 'CONTACTADA';


    // ---- PRO STATUS ----
    let proStatus = 'ABIERTA'; // Default for market

    // HELPER: Check if I am the winner
    const amIWinner = (job.professional && (job.professional._id?.toString() === userIdStr || job.professional.toString() === userIdStr)) ||
        (job.offers && job.offers.some(o => o.proId && (o.proId._id?.toString() === userIdStr || o.proId.toString() === userIdStr) && o.status === 'accepted'));

    if (amIWinner) {
        if (job.status === 'rated' || job.status === 'completed' || job.status === 'Culminada' || job.clientFinished) proStatus = 'TERMINADO';
        else if (job.proFinished) proStatus = 'VALIDANDO';
        else if (job.trackingStatus === 'started') proStatus = 'EN EJECUCIÓN';
        else proStatus = 'ACEPTADO';
    } else {
        // I am NOT the winner.
        // If someone else IS winner (in_progress/completed), I lost.
        const isJobTaken = job.status === 'in_progress' || job.status === 'completed' || job.status === 'rated';
        if (isJobTaken) {
            proStatus = 'PERDIDA';
        } else {
            // Job is still Open/Active. Check my interactions.
            const myOffer = job.offers && job.offers.find(o => o.proId && (o.proId._id?.toString() === userIdStr || o.proId.toString() === userIdStr));
            let hasChat = false;
            // Best effort chat check (depends on population)
            if (job.conversations && Array.isArray(job.conversations)) {
                // If conversations are strings, we can't check participants easily unless we rely on external "myChats".
                // BUT, this helper is called inside GET /me where "conversations" is injected as "chatsByJobId".
                // Let's assume the caller passes the right structure or I check "myChats" if available?
                // Actually, "conversations" in GET /me result is an array of chat objects.
                hasChat = job.conversations.length > 0; // If it's my list, these ARE my chats.
            }

            if (myOffer) {
                if (myOffer.status === 'rejected') proStatus = 'RECHAZADA'; // Or PERDIDA
                else proStatus = 'PRESUPUESTADA';
            } else if (hasChat) {
                proStatus = 'CONTACTADA';
            }
        }
    }

    return { clientStatus, proStatus };
};

// @desc    Calificar un trabajo y al profesional
// @route   POST /api/jobs/:id/rate
// @access  Private (Cliente)
router.post('/:id/rate', protect, async (req, res) => {
    try {
        const { rating, review } = req.body;
        const job = await Job.findById(req.params.id).populate('offers.proId'); // Asumiendo que offers tiene proId

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        // Verificar que el usuario es el cliente del trabajo
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Actualizar trabajo
        job.rating = rating;
        job.review = review;
        job.status = 'completed'; // Marcar como completado si no lo estaba
        await job.save();

        // Encontrar al profesional (asumiendo que hay un campo 'professional' o 'acceptedOffer')
        // En el modelo actual no vi campo 'professional', pero en app.js se maneja 'acceptedOffer'.
        // Necesito saber quién es el profesional.
        // Voy a asumir que el modelo Job tiene un campo 'professional' que se setea al aceptar oferta.
        // Si no, tengo que buscarlo en las ofertas aceptadas.

        // Revisando Job.js, no tiene campo professional explícito, solo client.
        // Pero app.js maneja offers.
        // Voy a agregar 'professional' al modelo Job para facilitar esto.

        if (job.professional) {
            const pro = await User.findById(job.professional);
            if (pro) {
                // Recalcular rating
                const proJobs = await Job.find({ professional: pro._id, rating: { $exists: true } });
                const totalRating = proJobs.reduce((acc, curr) => acc + curr.rating, 0);
                pro.rating = totalRating / proJobs.length;
                pro.reviewsCount = proJobs.length;
                await pro.save();
            }
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Crear una nueva solicitud de servicio (Job)
// @route   POST /api/jobs
// @access  Private (Solo Clientes)
router.post('/', protect, async (req, res) => {
    try {
        // 1. Validate User
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Usuario no autenticado o inválido.' });
        }

        const { title, description, category, subcategory, location, budget, images } = req.body;

        console.log("[POST /jobs] Received Payload:", { title, category, subcategory, userId: req.user._id });

        // 2. Validate Required Fields
        if (!title || !description || !category || !location) {
            return res.status(400).json({ message: 'Faltan campos obligatorios (Título, Descripción, Categoría o Ubicación).' });
        }

        // 3. Validate Category ID
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ message: 'La categoría seleccionada no es válida.' });
        }

        const job = new Job({
            client: req.user._id,
            title,
            description,
            category,
            subcategory,
            location,
            budget,
            images
        });

        const createdJob = await job.save();
        console.log("[POST /jobs] Saved Job:", createdJob._id);
        res.status(201).json(createdJob);
    } catch (error) {
        console.error("Error creating job:", error);
        // Handle Mongoose Validation Errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Error de validación: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: `Error del servidor: ${error.message}` });
    }
});

// @desc    Actualizar un trabajo existente
// @route   PUT /api/jobs/:id
// @access  Private (Cliente - Dueño)
router.put('/:id', protect, async (req, res) => {
    try {
        console.log(`[PUT /jobs/${req.params.id}] Payload:`, req.body);
        const {
            title,
            description,
            category,
            subcategory,
            location,
            budget,
            images
        } = req.body;

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        // Verificar que el usuario sea el dueño
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        job.title = title || job.title;
        job.description = description || job.description;
        job.category = category || job.category;
        job.subcategory = subcategory !== undefined ? subcategory : job.subcategory; // Permitir borrar / null
        job.location = location || job.location;
        job.budget = budget || job.budget;
        job.images = images || job.images;

        const updatedJob = await job.save();
        console.log(`[PUT /jobs/${req.params.id}] Job Updated:`, updatedJob);

        res.json(updatedJob);
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Actualizar solicitud de servicio (Job)
// @route   PUT /api/jobs/:id
// @access  Private (Solo el creador)
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, description, category, subcategory, location, images } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado para editar esta solicitud' });
        }

        job.title = title || job.title;
        job.description = description || job.description;

        // Handle Category update (Name or ID)
        if (category) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(category) && new mongoose.Types.ObjectId(category).toString() === category) {
                job.category = category;
            } else {
                // It's likely a name
                const categoryObj = await Category.findOne({ name: category });
                if (categoryObj) {
                    job.category = categoryObj._id;
                } else {
                    // If category not found by name, keep old or error? 
                    // Let's warn but maybe keep old to avoid crash, or error out.
                    // Better to error so user knows.
                    return res.status(400).json({ message: `Categoría '${category}' no encontrada.` });
                }
            }
        }

        job.subcategory = subcategory || job.subcategory;
        job.location = location || job.location;
        if (images) job.images = images;

        const updatedJob = await job.save();
        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Crear una oferta para un trabajo
// @route   POST /api/jobs/:id/offers
// @access  Private (Profesional)
router.post('/:id/offers', protect, async (req, res) => {
    try {
        const {
            amount,
            description,
            items,
            descriptionLine,
            duration,
            startDate,
            paymentTerms,
            currency,
            warranty,
            conditions,
            observations,
            addTax,
            taxRate
        } = req.body;

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        // Verificar si ya ofertó
        const alreadyOffered = job.offers.find(o => o.proId.toString() === req.user._id.toString());
        if (alreadyOffered) {
            return res.status(400).json({ message: 'Ya has enviado una oferta para este trabajo' });
        }

        const offer = {
            proId: req.user._id,
            amount: amount || req.body.total || req.body.price, // Fallback for compatibility
            description,
            items,
            descriptionLine,
            duration,
            startDate,
            paymentTerms,
            currency,
            warranty,
            conditions,
            observations,
            addTax,
            taxRate
        };

        job.offers.push(offer);
        await job.save();

        // Actualizar Interacción
        await JobInteraction.findOneAndUpdate(
            { job: job._id, user: req.user._id },
            { status: 'offered', hasUnread: false, updatedAt: Date.now() },
            { upsert: true }
        );

        // --- AUTO-CREATE CHAT ON OFFER ---
        // Garantizar que exista chat para que aparezca en el listado
        try {
            let chat = await Chat.findOne({
                job: job._id,
                participants: { $all: [req.user._id, job.client] }
            });

            if (!chat) {
                chat = new Chat({
                    job: job._id,
                    participants: [req.user._id, job.client],
                    messages: []
                });
            }

            // Mensaje automático de oferta
            const offerDisplay = offer.currency ? `${offer.currency} ${offer.amount}` : `$${offer.amount}`;
            chat.messages.push({
                sender: req.user._id, // Yo (Pro) envío el mensaje
                content: `He enviado una oferta de ${offerDisplay}`,
                read: false,
                timestamp: new Date()
            });
            chat.lastMessageDate = new Date();
            await chat.save();
        } catch (chatError) {
            console.error("Error creating auto-chat for offer:", chatError);
            // No bloqueamos la respuesta de la oferta, pero logueamos
        }

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Actualizar una oferta existente
// @route   PUT /api/jobs/:id/offers
// @access  Private (Profesional)
router.put('/:id/offers', protect, async (req, res) => {
    try {
        const {
            amount,
            description,
            items,
            descriptionLine,
            duration,
            startDate,
            paymentTerms,
            currency,
            warranty,
            conditions,
            observations,
            addTax,
            taxRate
        } = req.body;

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        const offerIndex = job.offers.findIndex(o => o.proId.toString() === req.user._id.toString());
        if (offerIndex === -1) {
            return res.status(404).json({ message: 'No has enviado una oferta para este trabajo' });
        }

        const offer = job.offers[offerIndex];
        offer.amount = amount || offer.amount;
        offer.description = description || offer.description;
        offer.items = items || offer.items;
        offer.descriptionLine = descriptionLine !== undefined ? descriptionLine : offer.descriptionLine;
        offer.duration = duration || offer.duration;
        offer.startDate = startDate || offer.startDate;
        offer.paymentTerms = paymentTerms || offer.paymentTerms;
        offer.currency = currency || offer.currency;
        offer.warranty = warranty || offer.warranty;
        offer.conditions = conditions || offer.conditions;
        offer.observations = observations || offer.observations;
        offer.addTax = addTax !== undefined ? addTax : offer.addTax;
        offer.taxRate = taxRate || offer.taxRate;
        offer.updatedAt = Date.now();
        offer.status = 'pending'; // Reset status so the client sees it as a new/fresh proposal
        offer.rejectionReason = undefined;

        job.offers[offerIndex] = offer;
        await job.save();

        // Actualizar Interacción
        await JobInteraction.findOneAndUpdate(
            { job: job._id, user: req.user._id },
            { status: 'offered', hasUnread: false, updatedAt: Date.now() },
            { upsert: true }
        );

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Asignar profesional al trabajo (Aceptar oferta)
// @route   PUT /api/jobs/:id/assign
// @access  Private (Cliente)
router.put('/:id/assign', protect, async (req, res) => {
    try {
        const { professionalId } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Marcar oferta ganadora como aceptada y las demás como rechazadas
        if (job.offers && job.offers.length > 0) {
            job.offers.forEach(offer => {
                if (offer.proId.toString() === professionalId) {
                    offer.status = 'accepted';
                } else {
                    offer.status = 'rejected';
                    offer.rejectionReason = 'Trabajo asignado a otro profesional.';
                }
            });
        }

        job.professional = professionalId;
        job.status = 'in_progress';
        job.trackingStatus = 'contracted';

        // TIMELINE EVENT: Contract Accepted
        job.projectHistory.push({
            eventType: 'offer_accepted',
            actor: req.user._id,
            actorRole: 'client',
            timestamp: new Date(),
            title: 'Oferta Aceptada',
            description: 'El cliente ha aceptado el presupuesto. El trabajo está oficialmente contratado.',
            isPrivate: false
        });

        await job.save();

        // ACTUALIZAR ESTADOS DE INTERACCIÓN
        // Ganador
        await JobInteraction.findOneAndUpdate(
            { job: job._id, user: professionalId },
            { status: 'won', hasUnread: true, updatedAt: Date.now() },
            { upsert: true }
        );

        // Perdedores (todos los demás que interactuaron con este trabajo)
        await JobInteraction.updateMany(
            { job: job._id, user: { $ne: professionalId } },
            { status: 'lost', hasUnread: true, updatedAt: Date.now() }
        );

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Rechazar una oferta
// @route   PUT /api/jobs/:id/offers/:proId/reject
router.put('/:id/offers/:proId/reject', protect, async (req, res) => {
    try {
        const { reason } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Trabajo no encontrado' });

        const offer = job.offers.find(o => o.proId.toString() === req.params.proId);
        if (offer) {
            offer.status = 'rejected';
            offer.rejectionReason = reason;
        }

        await job.save();

        // Notificar al profesional (vía interacción o sistema de notificación futuro)
        await JobInteraction.findOneAndUpdate(
            { job: job._id, user: req.params.proId },
            { status: 'rejected', hasUnread: true, updatedAt: Date.now() },
            { upsert: true }
        );

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Confirmar inicio de trabajo
// @route   PUT /api/jobs/:id/start-confirm
router.put('/:id/start-confirm', protect, async (req, res) => {
    try {
        const { startedOnTime } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Trabajo no encontrado' });

        job.trackingStatus = 'started';
        job.workStartedOnTime = startedOnTime;

        // TIMELINE EVENT: Work Started
        job.projectHistory.push({
            eventType: 'work_started',
            actor: req.user._id,
            actorRole: 'pro', // Usually pro confirms start
            timestamp: new Date(),
            title: 'Trabajo Iniciado',
            description: startedOnTime ? 'El profesional ha iniciado el trabajo a tiempo.' : 'El profesional ha iniciado el trabajo (con retraso reported).',
            isPrivate: false
        });

        await job.save();

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Subir fotos del trabajo en progreso
// @route   POST /api/jobs/:id/work-photos
router.post('/:id/work-photos', protect, async (req, res) => {
    try {
        const { image } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Trabajo no encontrado' });

        job.workPhotos.push(image);
        await job.save();

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Agregar imagen a un trabajo (Job)
// @route   PUT /api/jobs/:id/images
// @access  Private (Cliente)
router.put('/:id/images', protect, async (req, res) => {
    try {
        const { image } = req.body; // URL o Base64
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        if (!job.images) job.images = [];
        job.images.push(image);
        await job.save();

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cerrar solicitud (por parte del cliente)
// @route   PUT /api/jobs/:id/close
// @access  Private (Cliente)
router.put('/:id/close', protect, async (req, res) => {
    try {
        const { closureReason, hiredProId } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ message: 'Trabajo no encontrado' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'No autorizado para cerrar esta solicitud' });
        }

        // Definir estado basado en si se contrató a alguien
        job.status = hiredProId ? 'completed' : 'canceled';
        job.closureReason = closureReason;
        if (hiredProId) {
            job.hiredProId = hiredProId;
        }
        job.closedAt = Date.now();

        await job.save();
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener interacciones del profesional (estados)
// @route   GET /api/jobs/interactions
// @access  Private
router.get('/interactions', protect, async (req, res) => {
    try {
        const interactions = await JobInteraction.find({ user: req.user._id });
        res.json(interactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Actualizar estado de interacción de un profesional con un trabajo
// @route   POST /api/jobs/:id/interaction
// @access  Private
router.post('/:id/interaction', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['new', 'viewed', 'contacted', 'offered', 'won', 'lost', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        const interaction = await JobInteraction.findOneAndUpdate(
            { job: req.params.id, user: req.user._id },
            { status, updatedAt: Date.now() },
            { upsert: true, new: true }
        );

        res.json(interaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener todos los trabajos (para profesionales)
// @route   GET /api/jobs
// @access  Public / Private (Opcional, pero idealmente solo Pros lo ven o público)
router.get('/', async (req, res) => {
    try {
        // Filtros básicos REST
        const { category, location, professional, client, status } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (location) query.location = { $regex: location, $options: 'i' };
        if (professional) query.professional = professional;
        if (client) query.client = client;

        // DISABLE ALL SERVER SIDE EXCLUSIONS for now
        /*
        // FILTRO DE EXCLUSIÓN DE PROPIAS SOLICITUDES
        // DISABLED FOR DEBUGGING AS REQUESTED BY USER
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');
                console.log("[GET /jobs] Filtering for user:", decoded.id);
                // Si el token es válido, excluir solicitudes creadas por este usuario
                // MODIFICACION: Permitir ver propias solicitudes para testing si se solicita o default?
                // Comentamos la exclusión para facilitar debug en mismo dispositivo
                // if (decoded.id && !req.query.include_own) {
                //    query.client = { $ne: decoded.id };
                //    console.log("[GET /jobs] Query updated to exclude client:", decoded.id);
                // }
            } catch (err) {
                // Si el token es inválido, ignorar y mostrar todo (comportamiento guest)
                console.log("[GET /jobs] Token Verification Failed:", err.message);
            }
        } else {
            console.log("[GET /jobs] No Authorization Header found");
        }
        */

        // IMPLEMENT PAGINATION & OPTIMIZATION
        const limit = parseInt(req.query.limit) || 50; // Default to 50 jobs
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        let jobs = await Job.find(query)
            .select('-images -workPhotos -clientManagement -projectHistory') // Exclude heavy history
            .populate('client', 'name avatar')
            .populate('category', 'name color icon')
            //.populate('projectHistory.actor', 'name avatar email role') // Removed for list view
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // ADJUNTAR ESTADOS DE INTERACCIÓN SI HAY USUARIO
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');
                const userId = decoded.id;

                const interactionMap = {}; // DEFINED HERE
                const interactions = await JobInteraction.find({ user: userId }).lean();
                interactions.forEach(i => {
                    interactionMap[i.job.toString()] = {
                        status: i.status,
                        hasUnread: i.hasUnread || false
                    };
                });

                // --- NEW: Populate chats for this user (Optimized) ---
                const chats = await Chat.find({ participants: userId })
                    .select('_id job participants lastMessage lastMessageDate messages.read messages.sender messages.content') // Optimized fields
                    .populate('participants', 'name email avatar role')
                    .lean();

                // Group chats by job
                const chatsByJob = {};

                chats.forEach(chat => {
                    if (chat.job) {
                        const jobIdStr = chat.job.toString();
                        if (!chatsByJob[jobIdStr]) chatsByJob[jobIdStr] = [];
                        chatsByJob[jobIdStr].push(chat);
                    }
                });

                // Fetch current user for name usage
                const currentUser = await User.findById(userId).select('name');

                jobs = jobs.map(j => {
                    const jobChats = chatsByJob[j._id.toString()] || [];
                    const conversations = jobChats.map(chat => {
                        // REGLA: El "Pro" es el participante que NO es el cliente del trabajo.
                        const jobClientIdStr = (j.client._id || j.client).toString();

                        // Buscar el participante que no sea el cliente
                        const proParticipant = chat.participants.find(p => (p._id || p).toString() !== jobClientIdStr);

                        // Si no hay otro participante (raro), o si YO soy el pro y no está poblado, usar fallback
                        const finalProId = proParticipant ? (proParticipant._id || proParticipant) : ((userId.toString() !== jobClientIdStr) ? userId : null);
                        const finalProName = proParticipant ? proParticipant.name : ((userId.toString() !== jobClientIdStr) ? (currentUser ? currentUser.name : 'Profesional') : 'Usuario');

                        // OPTIMIZATION: Calc unread count using lightweight messages
                        // or trust pre-calculated values if we switch to aggregation later.
                        const unreadCount = (chat.messages || []).filter(m =>
                            m.sender && m.sender.toString() !== userId.toString() && !m.read
                        ).length;

                        return {
                            id: chat._id,
                            proId: finalProId,
                            proName: finalProName,
                            proEmail: proParticipant ? proParticipant.email : null,
                            proAvatar: proParticipant ? proParticipant.avatar : null,
                            clientName: j.client ? j.client.name : 'Cliente',
                            // OPTIMIZATION: Do NOT send full messages array.
                            lastMessage: chat.lastMessage || (chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content : ''),
                            unreadCount: unreadCount
                        };
                    });

                    // Calculate Statuses
                    let clientStatus = 'NUEVA', proStatus = 'ABIERTA';
                    try {
                        const statuses = calculateJobStatuses(j, userId);
                        clientStatus = statuses.clientStatus;
                        proStatus = statuses.proStatus;
                    } catch (e) {
                        // ignore
                    }

                    return {
                        ...j,
                        proInteractionStatus: interactionMap[j._id.toString()]?.status || 'new',
                        proInteractionHasUnread: interactionMap[j._id.toString()]?.hasUnread || false,
                        conversations: conversations,
                        calculatedClientStatus: clientStatus,
                        calculatedProStatus: proStatus
                    };
                });
            } catch (e) { console.log("Error populating pro chats:", e); }
        }

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener mis trabajos (para clientes)
// @route   GET /api/jobs/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        let jobs = await Job.find({ client: req.user._id })
            .select('-images -workPhotos -clientManagement')
            .populate('client', 'name avatar') // Ensure client is populated for ID checks
            .populate('category', 'name color icon')
            .populate('offers.proId', 'name email avatar rating reviewsCount')
            .populate('professional', 'name avatar email rating reviewsCount')
            .populate('projectHistory.actor', 'name avatar email role')
            .sort({ createdAt: -1 })
            .lean();

        if (jobs.length > 0) {
            console.log("[GET /me] First Job Fetched:", {
                id: jobs[0]._id,
                catType: typeof jobs[0].category,
                catVal: jobs[0].category,
                sub: jobs[0].subcategory
            });
        }


        // --- CHAT DISCOVERY STRATEGY ---
        // We need to return jobs where:
        // 1. The user is the CLIENT (already in 'jobs' array)
        // 2. The user is a PROFESSIONAL interacting via Chat (even if not officially assigned yet)

        // Find all chats where this user is a participant
        // Find all chats where this user is a participant
        // Find all chats where this user is a participant
        const allUserChats = await Chat.find({ participants: req.user._id })
            .select('_id job participants lastMessage lastMessageDate messages.read messages.sender messages.content') // OPTIMIZATION: Lightweight fields
            .populate('participants', 'name email avatar role')
            .populate('job', '_id client')
            .sort({ lastMessageDate: -1 })
            .lean();

        console.log(`[GET /me] Found ${allUserChats.length} chats for user ${req.user.name}`);

        const interactions = await JobInteraction.find({ user: req.user._id }).lean();
        const interactionMap = {};
        interactions.forEach(i => {
            interactionMap[i.job.toString()] = {
                status: i.status,
                hasUnread: i.hasUnread || false
            };
        });

        const myJobIds = jobs.map(j => j._id.toString());
        const jobIdsToFetch = [];

        // 1. Discovery from Interactions (New logic)
        interactions.forEach(i => {
            const jobIdStr = i.job.toString();
            if (!myJobIds.includes(jobIdStr)) {
                jobIdsToFetch.push(jobIdStr);
            }
        });

        // 2. Discovery from Chats (Virtual Jobs)
        for (const chat of allUserChats) {
            if (chat.job) {
                const jobId = chat.job._id || chat.job;
                const jobIdStr = jobId.toString();
                if (!myJobIds.includes(jobIdStr)) {
                    jobIdsToFetch.push(jobIdStr);
                }
            }
        }

        // 3. Discovery from Offers (Robust Fallback)
        // Ensure even if interaction is missing, if I have an offer, I see the job.
        const offeredJobs = await Job.find({ "offers.proId": req.user._id }).select('_id').lean();
        offeredJobs.forEach(j => {
            const jobIdStr = j._id.toString();
            if (!myJobIds.includes(jobIdStr)) {
                jobIdsToFetch.push(jobIdStr);
            }
        });

        // Remove duplicates
        const uniqueJobIdsToFetch = [...new Set(jobIdsToFetch)];
        const extraJobsMap = {};

        if (uniqueJobIdsToFetch.length > 0) {
            console.log(`[GET /me DEBUG] Fetching ${uniqueJobIdsToFetch.length} extra jobs:`, uniqueJobIdsToFetch);
            try {
                const fetchedJobs = await Job.find({ _id: { $in: uniqueJobIdsToFetch } })
                    .select('-images -workPhotos -clientManagement')
                    .populate('category', 'name color icon')
                    .populate('client', 'name avatar email')
                    .populate('offers.proId', 'name email avatar rating reviewsCount')
                    .populate('professional', 'name avatar email rating reviewsCount')
                    .lean();

                console.log(`[GET /me DEBUG] Successfully fetched ${fetchedJobs.length} extra jobs`);

                fetchedJobs.forEach(job => {
                    job.isVirtual = true;
                    extraJobsMap[job._id.toString()] = job;
                });
            } catch (e) {
                console.error("Error batch fetching virtual jobs:", e);
            }
        }

        // Add extra jobs to the main list
        const extraJobs = Object.values(extraJobsMap);
        console.log(`[GET /me] Adding ${extraJobs.length} virtual jobs (Pro Mode)`);
        jobs = [...jobs, ...extraJobs];

        // Sort combined list by date
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Use all found chats for mapping
        const allMyChats = allUserChats;

        // Map chats to jobs
        const chatsByJobId = {};
        const orphanChats = [];
        const validJobIds = new Set(jobs.map(j => j._id.toString())); // Updated to use ALL jobs (including virtual)

        allMyChats.forEach(chat => {
            // Also ensure message IDs are strings
            if (chat.messages) {
                chat.messages.forEach(m => m._id = m._id.toString());
            }

            if (chat.job) {
                const jId = chat.job._id ? chat.job._id.toString() : chat.job.toString(); // Handle populated
                if (validJobIds.has(jId)) {
                    if (!chatsByJobId[jId]) chatsByJobId[jId] = [];
                    chatsByJobId[jId].push(chat);
                } else {
                    orphanChats.push(chat);
                }
            } else {
                orphanChats.push(chat);
            }
        });

        // Attach to jobs
        console.log(`[GET /me] User ${req.user.name} (${req.user._id}). Final jobs list: ${jobs.length}.`);
        console.log(`[GET /me] Found ${allMyChats.length} total chats for user.`);
        console.log(`[GET /me] Chats by Job ID: ${Object.keys(chatsByJobId).length} groups. Orphans: ${orphanChats.length}`);

        // OPTIMIZATION: Fetch all interactions in one go to avoid N+1 queries
        const allJobIds = Array.from(validJobIds);
        let interactionsByJob = {};
        try {
            const allInteractions = await JobInteraction.find({ job: { $in: allJobIds } }).lean();
            allInteractions.forEach(i => {
                const jId = i.job.toString();
                if (!interactionsByJob[jId]) interactionsByJob[jId] = [];
                interactionsByJob[jId].push(i);
            });
            console.log(`[GET /me OPTIMIZATION] Fetched ${allInteractions.length} interactions for ${allJobIds.length} jobs.`);
        } catch (e) {
            console.error("Error batch fetching interactions:", e);
        }

        const jobsWithChats = await Promise.all(jobs.map(async job => {
            let jobChats = chatsByJobId[job._id.toString()] || [];

            // Add Interaction Summary depending on cached Map
            let interactionsSummary = { viewed: 0, contacted: 0, offered: 0, total: 0 };
            try {
                const ints = interactionsByJob[job._id.toString()] || [];
                interactionsSummary.viewed = ints.filter(i => i.status === 'viewed').length;
                interactionsSummary.contacted = ints.filter(i => i.status === 'contacted').length;
                interactionsSummary.offered = ints.filter(i => i.status === 'offered').length;
                interactionsSummary.total = ints.length;
            } catch (e) {
                console.log("Error processing interactions for job:", job._id, e);
            }

            // Format conversations (Lightweight)
            const conversations = jobChats.map(chat => {
                const jobClientIdStr = (job.client._id || job.client).toString();
                const proParticipant = chat.participants.find(p => (p._id || p).toString() !== jobClientIdStr);

                const finalProId = proParticipant ? (proParticipant._id || proParticipant) : ((req.user._id.toString() !== jobClientIdStr) ? req.user._id : null);
                const finalProName = proParticipant ? proParticipant.name : ((req.user._id.toString() !== jobClientIdStr) ? req.user.name : 'Usuario');

                // OPTIMIZATION: Calc unread count without loading full messages if possible,
                // or use the lightweight messages array we fetched.
                const unreadCount = (chat.messages || []).filter(m =>
                    m.sender && m.sender.toString() !== req.user._id.toString() && !m.read
                ).length;

                return {
                    id: chat._id,
                    proId: finalProId,
                    proName: finalProName,
                    proEmail: proParticipant ? proParticipant.email : null,
                    proAvatar: proParticipant ? proParticipant.avatar : 'https://placehold.co/100',
                    proRating: proParticipant?.rating,
                    proReviewsCount: proParticipant?.reviewsCount,
                    // OPTIMIZATION: Do NOT send full messages array to dashboard.
                    // Only send preview info.
                    lastMessage: chat.lastMessage || (chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content : ''),
                    unreadCount: unreadCount,
                    rawTimestamp: new Date(chat.lastMessageDate || chat.updatedAt).getTime()
                };
            });

            const isVirtual = !myJobIds.includes(job._id.toString());
            return { ...job, conversations, interactionsSummary, isVirtual };
        }));

        // --- FORMATTING STEP: Ensure Frontend Receives "proName", "proId", etc. ---
        // The frontend expects these fields flattened on the conversation object.
        const formattedJobs = jobsWithChats.map(job => {
            // RE-ATTACH FORCED CHATS IF MISSING explicitly
            if (job.isRescued && job.forceChats && (!job.conversations || job.conversations.length === 0)) {
                console.log(`[FORMAT] Re-attaching ${job.forceChats.length} forced chats to job ${job._id}`);
                job.conversations = job.forceChats;
            }

            if (job.conversations && job.conversations.length > 0) {
                job.conversations = job.conversations.map(chat => {
                    return chat;
                });
            }

            // CALCULATE FORMAL STATUSES
            let clientStatus = 'NUEVA', proStatus = 'ABIERTA';
            try {
                const statuses = calculateJobStatuses(job, req.user._id);
                clientStatus = statuses.clientStatus;
                proStatus = statuses.proStatus;
            } catch (e) {
                console.error(`Error calculating job status for job ${job._id} in GET /me:`, e);
            }

            return {
                ...job,
                proInteractionStatus: interactionMap[job._id.toString()]?.status || 'new',
                proInteractionHasUnread: interactionMap[job._id.toString()]?.hasUnread || false,
                calculatedClientStatus: clientStatus,
                calculatedProStatus: proStatus
            };
        });

        // Optional backend-side filter for dual role separation
        const role = (req.query.role || '').toLowerCase();
        let finalJobs = formattedJobs;
        if (role === 'pro') {
            finalJobs = formattedJobs.filter(job => {
                try {
                    const clientId = job.client ? (job.client._id || job.client) : null;
                    return !clientId || String(clientId) !== String(req.user._id);
                } catch (e) {
                    return true;
                }
            });
        }


        res.json(finalJobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener un trabajo por ID
// @route   GET /api/jobs/:id
// @access  Public / Private (para ver chats)
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .select('-workPhotos -clientManagement -projectHistory') // Exclude heavy/private fields
            .populate('client', 'name phone avatar email')
            .populate('category', 'name')
            .populate('offers.proId', 'name avatar rating reviewsCount')
            .populate('professional', 'name avatar email rating reviewsCount')
            .populate('projectHistory.actor', 'name avatar email role')
            .lean();

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        // --- LÓGICA DE CONVERSACIONES ---
        // Intentar identificar al usuario (soft auth)
        let conversations = [];
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');
                const userId = decoded.id;

                // Buscar chats asociados a este trabajo
                let chatQuery = { job: job._id };

                // Si no es el dueño, solo ver su propio chat
                if (job.client._id.toString() !== userId) {
                    chatQuery.participants = userId;
                }

                const chats = await Chat.find(chatQuery)
                    .select({ messages: { $slice: -50 } }) // OPTIMIZATION: Only last 50 messages
                    .populate('participants', 'name email avatar role rating reviewsCount')
                    .lean();

                // Formatear para el frontend
                const currentUser = await User.findById(userId).select('name');
                const jobClientIdStr = (job.client._id || job.client).toString();

                conversations = chats.map(chat => {
                    // El "pro" es el participante que NO es el cliente del trabajo
                    const proParticipant = chat.participants.find(p => (p._id || p).toString() !== jobClientIdStr);

                    if (proParticipant) {
                        console.log(`[GET /jobs/:id] Job ${job._id} Chat ${chat._id} Pro: ${proParticipant.name}`);
                    }

                    const finalProId = proParticipant ? (proParticipant._id || proParticipant) : ((userId !== jobClientIdStr) ? userId : null);
                    const finalProName = proParticipant ? proParticipant.name : ((userId !== jobClientIdStr) ? (currentUser ? currentUser.name : 'Usuario') : 'Usuario');

                    return {
                        id: chat._id,
                        proId: finalProId,
                        proName: finalProName,
                        proEmail: proParticipant ? proParticipant.email : null,
                        proAvatar: proParticipant ? proParticipant.avatar : null,
                        proRating: proParticipant ? proParticipant.rating : 0,
                        proReviewsCount: proParticipant ? proParticipant.reviewsCount : 0,
                        messages: chat.messages.map(m => ({
                            id: m._id ? m._id.toString() : null,
                            text: m.content,
                            sender: m.sender.toString() === jobClientIdStr ? 'client' : 'pro',
                            timestamp: m.createdAt,
                            media: m.media
                        })),
                        readByClient: true,
                        readByPro: true
                    };
                });
            } catch (err) {
                console.log("Token inválido en GET /jobs/:id, omitiendo chats.");
            }
        }

        // Obtener interacción específica si el usuario está autenticado
        let proInteraction = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');
                proInteraction = await JobInteraction.findOne({ job: job._id, user: decoded.id }).lean();
            } catch (e) { }
        }

        // Add Interaction Summary for status calculation (Consistency with GET /me)
        let interactionsSummary = { viewed: 0, contacted: 0, offered: 0, total: 0 };
        try {
            const ints = await JobInteraction.find({ job: job._id });
            interactionsSummary.viewed = ints.filter(i => i.status === 'viewed').length;
            interactionsSummary.contacted = ints.filter(i => i.status === 'contacted').length;
            interactionsSummary.offered = ints.filter(i => i.status === 'offered').length;
            interactionsSummary.total = ints.length;
        } catch (e) {
            console.log("Error fetching interactions for single job detail:", job._id, e);
        }

        // CALCULATE FORMAL STATUSES
        let calculatedClientStatus = 'NUEVA';
        let calculatedProStatus = 'ABIERTA';

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');
                const userId = decoded.id;
                const statuses = calculateJobStatuses(job, userId);
                calculatedClientStatus = statuses.clientStatus;
                calculatedProStatus = statuses.proStatus;
            } catch (e) {
                // Token invalid or other error, fallback to defaults
            }
        }

        res.json({
            ...job,
            conversations,
            proInteraction,
            interactionsSummary,
            calculatedClientStatus,
            calculatedProStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Marcar interacción como leída
// @route   PUT /api/jobs/:id/interaction/read
router.put('/:id/interaction/read', protect, async (req, res) => {
    try {
        const interaction = await JobInteraction.findOneAndUpdate(
            { job: req.params.id, user: req.user._id },
            { hasUnread: false },
            { new: true }
        );
        res.json({ success: true, interaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Marcar trabajo como finalizado (doble confirmación)
// @route   PUT /api/jobs/:id/finish
router.put('/:id/finish', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Trabajo no encontrado' });

        const userId = req.user._id.toString();

        if (job.client.toString() === userId) {
            job.clientFinished = true;
            if (job.proFinished) {
                job.validatedEndDate = job.validatedEndDate || new Date();
            }
            // TIMELINE EVENT
            job.projectHistory.push({
                eventType: 'job_finished',
                actor: req.user._id,
                actorRole: 'client',
                timestamp: new Date(),
                title: 'Cliente Validó Finalización',
                description: 'El cliente ha confirmado que el trabajo está terminado.',
                isPrivate: false
            });
        } else if (job.professional && job.professional.toString() === userId) {
            job.proFinished = true;
            job.validatedEndDate = new Date();
            // TIMELINE EVENT
            job.projectHistory.push({
                eventType: 'job_finished',
                actor: req.user._id,
                actorRole: 'pro',
                timestamp: new Date(),
                title: 'Profesional Marcó como Listo',
                description: 'El profesional reporta que el trabajo ha concluido.',
                isPrivate: false
            });

            // NOTIFY CLIENT
            try {
                const client = await User.findById(job.client);
                if (client && client.pushToken) {
                    await sendPushNotification(
                        client.pushToken,
                        "Trabajo Finalizado",
                        "El profesional ha marcado el trabajo como finalizado. Por favor valida y califica.",
                        { type: 'job_update', jobId: job._id }
                    );
                }
            } catch (e) {
                console.error("Error sending finish notification:", e);
            }
        } else {
            return res.status(403).json({ message: 'No autorizado para finalizar este trabajo' });
        }

        if (job.clientFinished && job.proFinished) {
            job.status = 'completed';
            job.trackingStatus = 'finished';
        }

        await job.save();
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Sistema de valoración mutua
// @route   POST /api/jobs/:id/rate-mutual
router.post('/:id/rate-mutual', protect, async (req, res) => {
    try {
        const { revieweeId, rating, comment, answers } = req.body;
        const jobId = req.params.id;
        const reviewerId = req.user._id;

        // Crear la reseña
        const review = new Review({
            job: jobId,
            reviewer: reviewerId,
            reviewee: revieweeId,
            reviewerRole: (req.user.role === 'professional' || req.user.role === 'admin') ? 'pro' : req.user.role,
            rating,
            comment,
            answers
        });

        await review.save();

        const reviewee = await User.findById(revieweeId);

        // Actualizar el trabajo si es necesario
        const job = await Job.findById(jobId);
        if (job) {
            // Agregar al historial
            job.projectHistory.push({
                eventType: 'note_added', // Usamos note_added para la reseña
                actor: reviewerId,
                actorRole: req.user.role === 'admin' ? 'pro' : req.user.role,
                title: (req.user.role === 'client' || req.user.role === 'admin') ? 'Cliente Valoró el Trabajo' : 'Profesional Valoró al Cliente',
                description: `Calificación: ${rating} estrellas. "${comment || 'Sin comentarios'}"`,
                timestamp: new Date()
            });

            // Si alguien valora, el trabajo escala a 'rated' (TERMINADO en el frontend)
            job.status = 'rated';

            // Usar IDs para marcar quién ya valoró de forma fiable
            const jobClientId = job.client.toString();
            const jobProId = job.professional ? job.professional.toString() : null;
            const reviewerIdStr = reviewerId.toString();

            if (reviewerIdStr === jobClientId) {
                console.log(`[rate-mutual] Marking clientRated = true for job ${jobId}`);
                job.clientRated = true;
            } else {
                // Si el que califica no es el dueño (cliente), asumimos que es el profesional.
                // Verificamos si es el profesional asignado o tiene una oferta aceptada.
                const isAssignedPro = jobProId && reviewerIdStr === jobProId;
                const hasAcceptedOffer = job.offers && job.offers.some(o =>
                    o.proId.toString() === reviewerIdStr && o.status === 'accepted'
                );

                if (isAssignedPro || hasAcceptedOffer || req.user.role === 'professional' || req.user.role === 'admin') {
                    console.log(`[rate-mutual] Marking proRated = true for job ${jobId}`);
                    job.proRated = true;
                }
            }
            await job.save();
        }

        // Si es una reseña PARA un profesional, actualizar su rating promedio en User model
        if (reviewee && reviewee.role === 'professional') {
            const allReviews = await Review.find({ reviewee: revieweeId, reviewerRole: 'client' });
            const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
            reviewee.rating = avgRating;
            reviewee.reviewsCount = allReviews.length;
            await reviewee.save();
        }

        res.status(201).json(review);
    } catch (error) {
        console.error("Error in rate-mutual:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Eliminar una oferta específica
// @route   DELETE /api/jobs/:id/offers/:offerId
// @access  Private (Admin, Dueño del trabajo o Dueño de la oferta)
router.delete('/:id/offers/:offerId', protect, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        const offer = job.offers.id(req.params.offerId);

        if (!offer) {
            return res.status(404).json({ message: 'Oferta no encontrada' });
        }

        // Verificar permisos: Admin, Dueño del Job o Dueño de la Oferta
        const isAdmin = req.user.role === 'admin';
        const isJobOwner = job.client.toString() === req.user._id.toString();
        const isOfferOwner = offer.proId.toString() === req.user._id.toString();

        if (!isAdmin && !isJobOwner && !isOfferOwner) {
            return res.status(403).json({ message: 'No autorizado para eliminar esta oferta' });
        }

        // Eliminar oferta usando pull
        job.offers.pull(req.params.offerId);
        await job.save();

        res.json({ message: 'Oferta eliminada', jobId: job._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Eliminar un trabajo (Job)
// @route   DELETE /api/jobs/:id
// @access  Private (Admin o Dueño)
router.delete('/:id', protect, async (req, res) => {
    try {
        console.log(`[DELETE JOB] REQUEST: Delete Job ${req.params.id} | User: ${req.user._id} | Role: ${req.user.role}`);

        const job = await Job.findById(req.params.id);

        if (!job) {
            console.log(`[DELETE JOB] Job ${req.params.id} not found`);
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        // Verificar permisos: Admin o Dueño del Job
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';
        const isAdmin = userRole === 'admin';
        const isJobOwner = job.client.toString() === req.user._id.toString();

        if (!isAdmin && !isJobOwner) {
            console.log(`[DELETE JOB] AUTHORIZATION FAILED.`);
            console.log(`[DELETE JOB] User ID: ${req.user._id}`);
            console.log(`[DELETE JOB] User Role (DB): '${req.user.role}'`);
            console.log(`[DELETE JOB] Is Admin evaluated: ${isAdmin}`);
            console.log(`[DELETE JOB] Is Job Owner evaluated: ${isJobOwner} (Job Client: ${job.client})`);

            return res.status(403).json({
                message: 'No autorizado para eliminar este trabajo',
                debug: {
                    userRole: req.user.role,
                    isJobOwner,
                    jobClient: job.client
                }
            });
        }

        // SOFT DELETE PARA CLIENTES / NO-ADMINS
        if (!isAdmin) {
            console.log(`[DELETE JOB] Soft deleting job ${job._id} for user ${req.user._id}`);
            job.status = 'canceled';
            job.closedAt = Date.now();
            await job.save();
            return res.json({ message: 'Solicitud eliminada correctamente' });
        }

        // HARD DELETE PARA ADMINS (Comportamiento original)
        // Eliminar chats asociados para limpieza
        console.log(`[DELETE JOB] Deleting chats for job ${job._id}...`);
        try {
            const chatResult = await Chat.deleteMany({ job: job._id });
            console.log(`[DELETE JOB] Deleted ${chatResult.deletedCount} chats.`);
        } catch (err) {
            console.error(`[DELETE JOB] Error deleting chats:`, err);
        }

        // Eliminar interacciones asociadas
        console.log(`[DELETE JOB] Deleting interactions for job ${job._id}...`);
        try {
            const interactionResult = await JobInteraction.deleteMany({ job: job._id });
            console.log(`[DELETE JOB] Deleted ${interactionResult.deletedCount} interactions.`);
        } catch (err) {
            console.error(`[DELETE JOB] Error deleting interactions:`, err);
        }

        // Eliminar el trabajo
        console.log(`[DELETE JOB] Deleting job document ${job._id}...`);
        await Job.deleteOne({ _id: job._id });
        console.log(`[DELETE JOB] Job ${job._id} deleted successfully.`);

        res.json({ message: 'Trabajo eliminado permanentemente (Admin)' });
    } catch (error) {
        console.error(`[DELETE JOB] CRITICAL ERROR:`, error);
        res.status(500).json({ message: `Error deleting job: ${error.message}` });
    }
});

// @desc    Agregar evento al historial (Timeline)
// @route   POST /api/jobs/:id/timeline
// @access  Private (Participantes)
router.post('/:id/timeline', protect, async (req, res) => {
    try {
        const { eventType, title, description, mediaUrl, metadata, isPrivate } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        // Verificar autorización (Cliente o Profesional Asignado)
        const isClient = job.client.toString() === req.user._id.toString();
        const isPro = job.professional && job.professional.toString() === req.user._id.toString();

        if (!isClient && !isPro) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const newEvent = {
            eventType,
            actor: req.user._id,
            actorRole: isClient ? 'client' : 'pro',
            timestamp: new Date(),
            title,
            description,
            mediaUrl,
            metadata,
            isPrivate: isPrivate || false
        };

        job.projectHistory.push(newEvent);

        // Update legacy tracking status if applicable (for backward compatibility or simpler query)
        if (eventType === 'work_started' && job.trackingStatus !== 'started') {
            job.trackingStatus = 'started';
        }
        if (eventType === 'job_finished') {
            if (isClient) {
                job.clientFinished = true;
                if (job.proFinished) job.validatedEndDate = job.validatedEndDate || new Date();
            }
            if (isPro) {
                job.proFinished = true;
                job.validatedEndDate = new Date();
            }

            // Check dual finish
            if (job.clientFinished && job.proFinished) {
                job.status = 'completed';
                job.trackingStatus = 'finished';
                job.closedAt = new Date();
            }
        }

        await job.save();

        // Return the FULLY populated job to refresh UI immediately
        const populatedJob = await Job.findById(job._id)
            .populate('client', 'name phone avatar email')
            .populate('category', 'name')
            .populate('offers.proId', 'name avatar rating reviewsCount')
            .populate('professional', 'name avatar email rating reviewsCount')
            .populate('projectHistory.actor', 'name avatar email role');

        res.json(populatedJob);
    } catch (error) {
        console.error("Error adding timeline event:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- CLIENT MANAGEMENT LOG ROUTES ---

// @desc    Add Payment to Private Log
// @route   POST /api/jobs/:id/client-log/payment
router.post('/:id/client-log/payment', protect, async (req, res) => {
    try {
        const { amount, note, date, evidenceUrl } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!job.clientManagement) job.clientManagement = {};
        if (!job.clientManagement.payments) job.clientManagement.payments = [];

        job.clientManagement.payments.push({
            amount,
            note,
            date: date || new Date(),
            evidenceUrl
        });

        await job.save();
        res.json(job.clientManagement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add Private Note
// @route   POST /api/jobs/:id/client-log/note
router.post('/:id/client-log/note', protect, async (req, res) => {
    try {
        const { text, date } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!job.clientManagement) job.clientManagement = {};
        if (!job.clientManagement.privateNotes) job.clientManagement.privateNotes = [];

        job.clientManagement.privateNotes.push({
            text,
            date: date || new Date()
        });

        await job.save();
        res.json(job.clientManagement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update Validated Dates
// @route   PUT /api/jobs/:id/client-log/dates
router.put('/:id/client-log/dates', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!job.clientManagement) job.clientManagement = {};

        if (startDate) job.clientManagement.validatedStartDate = startDate;
        if (endDate) job.clientManagement.validatedEndDate = endDate;

        await job.save();
        res.json(job.clientManagement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add Photo to Private Log
// @route   POST /api/jobs/:id/client-log/photo
router.post('/:id/client-log/photo', protect, async (req, res) => {
    try {
        const { url } = req.body;
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!job.clientManagement) job.clientManagement = {};
        if (!job.clientManagement.beforePhotos) job.clientManagement.beforePhotos = [];

        job.clientManagement.beforePhotos.push({
            url,
            uploadedAt: new Date()
        });

        await job.save();
        res.json(job.clientManagement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
