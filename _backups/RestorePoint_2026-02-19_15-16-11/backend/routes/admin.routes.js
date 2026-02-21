const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Business = require('../models/Business');
const Job = require('../models/Job');
const Chat = require('../models/Chat');
const JobInteraction = require('../models/JobInteraction');

// --- GESTIÓN DE USUARIOS ---

// Obtener todos los chats (Admin)
router.get('/chats', async (req, res) => {
    try {
        const chats = await Chat.find()
            .populate('participants', 'name email role')
            .populate('job', 'title status budget')
            .sort({ lastMessageDate: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener detalle de chat (Admin)
router.get('/chats/:id', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
            .populate('participants', 'name email role avatar')
            .populate('messages.sender', 'name role')
            .populate({
                path: 'job',
                select: 'title status budget offers source', // Traer ofertas del trabajo
                populate: { path: 'offers.proId', select: 'name' }
            });
        if (chat) {
            res.json(chat);
        } else {
            res.status(404).json({ message: 'Chat no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener chats por Job ID (Admin)
router.get('/chats/job/:jobId', async (req, res) => {
    try {
        const chats = await Chat.find({ job: req.params.jobId })
            .populate('participants', 'name role')
            .populate('messages.sender', 'name role')
            .sort({ lastMessageDate: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener todos los usuarios con filtros
// Query params: role, search (nombre)
router.get('/users', async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = {};

        if (role) query.role = role;
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Excluir campos pesados para listado ágil
        const users = await User.find(query)
            .select('-avatar -documents -password -profiles.gallery')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener usuarios pendientes de verificación (Legacy support)
router.get('/users/pending', async (req, res) => {
    try {
        const users = await User.find({ role: 'professional', isVerified: false });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verificar un usuario
router.put('/users/verify/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isVerified = true;
            await user.save();
            res.json({ message: 'Usuario verificado exitosamente' });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Moderación de valoraciones
router.put('/users/:id/rating', async (req, res) => {
    try {
        const { rating } = req.body;
        const user = await User.findById(req.params.id);
        if (user) {
            user.rating = rating;
            await user.save();
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener detalles completos de un usuario
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id); // No excluir password, para saber si tiene o no, aunque por seguridad no se deberia enviar, pero aqui el admin puede sobreescribirlo
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar usuario completo (Admin)
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.cedula = req.body.cedula || user.cedula;
            user.role = req.body.role || user.role;
            user.phone = req.body.phone || user.phone;
            user.isVerified = req.body.isVerified !== undefined ? req.body.isVerified : user.isVerified;

            if (req.body.password) {
                const bcrypt = require('bcryptjs'); // Importar localmente si no está arriba, o asegurar import global
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Activar / Desactivar Usuario (Soft Delete)
router.put('/users/:id/toggle-active', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            // Invertir estado (si es undefined, asumir true y poner false)
            const currentState = user.isActive !== undefined ? user.isActive : true;
            user.isActive = !currentState;
            await user.save();
            res.json({ message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`, isActive: user.isActive });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- HELPER STATUS CALCULATOR (Duplicated from jobs.routes.js but adapted for Admin View) ---
const calculateAdminJobStatuses = (job) => {
    // For Admin, we act as if we are checking the "Winner's" perspective if assigned.
    const userIdStr = job.professional?._id?.toString() || job.professional?.toString();

    // ---- CLIENT STATUS ----
    let clientStatus = 'NUEVA';

    if (job.status === 'canceled') clientStatus = 'ELIMINADA';
    else if (job.status === 'rated' || (job.status === 'completed' && job.clientFinished && job.rating)) clientStatus = 'FINALIZADA';
    else if (job.status === 'completed' && job.clientFinished) clientStatus = 'VALORACIÓN';
    else if (job.proFinished && !job.clientFinished) clientStatus = 'VALIDANDO';
    else if (job.status === 'in_progress' && job.trackingStatus === 'started') clientStatus = 'EN EJECUCIÓN';
    else if (job.status === 'in_progress' || (job.offers && job.offers.some(o => o.status === 'accepted'))) clientStatus = 'ACEPTADO';
    else if (job.offers && job.offers.some(o => o.status === 'pending')) clientStatus = 'PRESUPUESTADA';
    else if ((job.conversations && job.conversations.length > 0) || (job.interactionsSummary?.contacted > 0)) clientStatus = 'CONTACTADA';

    // ---- PRO STATUS (Winner View) ----
    let proStatus = 'ABIERTA';

    if (userIdStr) {
        // There is a professional assigned/winner
        if (job.status === 'rated' || (job.status === 'completed' && job.clientFinished)) proStatus = 'FINALIZADA';
        else if (job.proFinished) proStatus = 'VALIDANDO';
        else if (job.trackingStatus === 'started') proStatus = 'EN EJECUCIÓN';
        else if (job.status === 'in_progress' || job.status === 'active') proStatus = 'ACEPTADO';
    } else {
        // No winner yet. Admin sees generic state.
        // Check if any offers exist from anyone
        const hasOffers = job.offers && job.offers.some(o => o.status === 'pending');
        // Check if any chats exist
        const hasChats = (job.conversations && job.conversations.length > 0) || (job.interactionsSummary?.contacted > 0);

        if (hasOffers) proStatus = 'PRESUPUESTADA';
        else if (hasChats) proStatus = 'CONTACTADA';
        else if (job.status === 'active') proStatus = 'ABIERTA';
        else proStatus = 'NO DISPONIBLE';
    }

    return { clientStatus, proStatus };
};

// --- GESTIÓN DE TRABAJOS (JOBS) ---

// Obtener todos los trabajos con filtros
// Query params: status (active, archived, etc), search (titulo)
router.get('/jobs', async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status) query.status = status;
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const jobs = await Job.find(query)
            .populate('client', 'name email')
            .populate('category', 'name')
            .populate('offers.proId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Agregar resumen de interacciones para cada trabajo
        const jobsWithInteractions = await Promise.all(jobs.map(async (job) => {
            const interactions = await JobInteraction.find({ job: job._id });

            const jobWithSummary = {
                ...job,
                interactionsSummary: {
                    viewed: interactions.filter(i => i.status === 'viewed').length,
                    contacted: interactions.filter(i => i.status === 'contacted').length,
                    offered: interactions.filter(i => i.status === 'offered').length,
                    total: interactions.length
                }
            };

            // Calculate Statuses
            try {
                const { clientStatus, proStatus } = calculateAdminJobStatuses(jobWithSummary);
                jobWithSummary.calculatedClientStatus = clientStatus;
                jobWithSummary.calculatedProStatus = proStatus;
            } catch (err) {
                console.error(`Error calculating admin status for job ${job._id}:`, err);
                jobWithSummary.calculatedClientStatus = 'ERROR';
                jobWithSummary.calculatedProStatus = 'ERROR';
            }

            return jobWithSummary;
        }));

        res.json(jobsWithInteractions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener detalle completo de un trabajo (Admin View)
router.get('/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('client', 'name email avatar')
            .populate('category', 'name')
            .populate('hiredProId', 'name email avatar')
            .lean();

        if (!job) {
            return res.status(404).json({ message: 'Trabajo no encontrado' });
        }

        if (!Chat) console.error("CRITICAL: Chat model is undefined in route!");
        if (!JobInteraction) console.error("CRITICAL: JobInteraction model is undefined in route!");

        // 1. Obtener todas las interacciones (Profesionales que han visto/interactuado)
        const interactions = await JobInteraction.find({ job: job._id })
            .populate('user', 'name email avatar rating reviewCount')
            .lean();

        // 2. Obtener todos los chats de este trabajo
        const chats = await Chat.find({ job: job._id })
            .populate('participants', 'name')
            .populate('messages.sender', 'name') // Para ver último mensaje
            .lean();

        if (!chats) console.error("Warning: Chat.find returned undefined");
        if (!interactions) console.error("Warning: JobInteraction.find returned undefined");

        // 3. Construir el contexto por profesional
        const professionalContexts = await Promise.all(interactions.map(async (interaction) => {
            const pro = interaction.user;
            if (!pro) return null; // Should not happen if data integrity is good

            const proIdStr = pro._id.toString();

            // Buscar Chat específico para este profesional en este trabajo
            const chat = chats.find(c => {
                const participantIds = c.participants.map(p => (p._id || p).toString());
                return participantIds.includes(proIdStr);
            });

            // Buscar Oferta específica
            const offer = job.offers ? job.offers.find(o => o.proId && o.proId.toString() === proIdStr) : null;

            // Calcular Estado para ESTE Profesional
            let calculatedStatus = 'NUEVA'; // Default si solo hubiera interaction 'new' pero no logic

            // Lógica de estado per-pro
            if (interaction.status === 'viewed') calculatedStatus = 'VISTA';

            // Si hay chat o 'contacted'
            if ((chat && chat.messages.length > 0) || interaction.status === 'contacted') {
                calculatedStatus = 'CONTACTADA';
            }

            // Si hay oferta
            if (offer) {
                if (offer.status === 'pending') calculatedStatus = 'PRESUPUESTADA';
                if (offer.status === 'accepted') calculatedStatus = 'ACEPTADO'; // o EN EJECUCION si trackingStatus avanza
                if (offer.status === 'rejected') calculatedStatus = 'RECHAZADA';
            }

            // Estados avanzados globales que afectan al pro (si fue el contratado)
            if (job.hiredProId && job.hiredProId.toString() === proIdStr) {
                // Es el ganador
                if (job.trackingStatus === 'started') calculatedStatus = 'EN EJECUCIÓN';
                if (job.proFinished) calculatedStatus = 'VALIDANDO'; // Pro terminó, espera cliente
                if (job.clientFinished && job.status === 'completed') calculatedStatus = 'FINALIZADA';
                if (job.status === 'rated' || (job.status === 'completed' && job.clientFinished && (job.rating > 0 || job.review))) calculatedStatus = 'FINALIZADA';
            } else if (job.hiredProId && job.hiredProId.toString() !== proIdStr) {
                // Otro ganó
                if (offer) calculatedStatus = 'PERDIDA'; // Si ofertó y otro ganó
                else calculatedStatus = 'CERRADA'; // Si solo miró/chateó y se cerró
            }

            return {
                professional: pro,
                interactionStatus: interaction.status, // raw db status
                calculatedStatus: calculatedStatus,
                hasChat: !!chat,
                chatId: chat ? chat._id : null,
                metrics: {
                    messagesCount: chat && chat.messages ? chat.messages.length : 0,
                    lastMessage: chat && chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null,
                },
                chat: chat || null,
                offer: offer,
                updatedAt: interaction.updatedAt
            };
        }));

        // Filtrar nulos
        const validContexts = professionalContexts.filter(c => c !== null);

        // Calcular estado Cliente Global (reutilizando lógica existente o simplificada)
        let clientStatus = 'NUEVA';
        const safeChats = chats || [];
        const safeInteractions = interactions || [];

        if (job.status === 'canceled') clientStatus = 'ELIMINADA';
        else if (job.status === 'completed' && job.clientFinished) clientStatus = 'FINALIZADA'; // O VALORACIÓN
        else if (job.proFinished) clientStatus = 'VALIDANDO';
        else if (job.trackingStatus === 'started') clientStatus = 'EN EJECUCIÓN';
        else if (job.status === 'in_progress' || (job.offers && job.offers.some(o => o.status === 'accepted'))) clientStatus = 'ACEPTADO';
        else if (job.offers && job.offers.some(o => o.status === 'pending')) clientStatus = 'PRESUPUESTADA'; // Al menos una oferta
        else if (safeChats.length > 0 || safeInteractions.some(i => i.status === 'contacted')) clientStatus = 'CONTACTADA';


        res.json({
            job: {
                ...job,
                calculatedClientStatus: clientStatus
            },
            professionalContexts: validContexts
        });

    } catch (error) {
        console.error("Error fetching job details:", error);
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un trabajo (Admin)
router.put('/jobs/:id', async (req, res) => {
    try {
        const { title, description, category, subcategory, status, location } = req.body;
        const job = await Job.findById(req.params.id);

        if (job) {
            if (title) job.title = title;
            if (description) job.description = description;
            if (category) job.category = category;
            if (subcategory) job.subcategory = subcategory;
            if (status) job.status = status;
            if (location) job.location = location;

            const updatedJob = await job.save();
            res.json(updatedJob);
        } else {
            res.status(404).json({ message: 'Trabajo no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GESTIÓN DE CATEGORÍAS ---

// Crear nueva categoría
router.post('/categories', async (req, res) => {
    try {
        const { name, subcategories, icon, color } = req.body;
        const category = new Category({ name, subcategories, icon, color });
        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Editar categoría existente
router.put('/categories/:id', async (req, res) => {
    try {
        const { name, subcategories, icon, color, isActive } = req.body;
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = name || category.name;
            category.subcategories = subcategories || category.subcategories;
            category.icon = icon || category.icon;
            category.color = color || category.color;
            if (isActive !== undefined) category.isActive = isActive;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Categoría no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Eliminar categoría
router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            await category.deleteOne();
            res.json({ message: 'Categoría eliminada' });
        } else {
            res.status(404).json({ message: 'Categoría no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GESTIÓN DE ARTÍCULOS (BLOG) ---

router.post('/articles', async (req, res) => {
    try {
        const { title, category, content, image } = req.body;
        const article = new Article({ title, category, content, image });
        const createdArticle = await article.save();
        res.status(201).json(createdArticle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GESTIÓN DE ANUNCIANTES ---

router.post('/businesses', async (req, res) => {
    try {
        const business = new Business(req.body);
        const createdBusiness = await business.save();
        res.status(201).json(createdBusiness);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/businesses', async (req, res) => {
    try {
        const businesses = await Business.find().sort({ createdAt: -1 });
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/businesses/:id', async (req, res) => {
    try {
        const { name, category, subcategory, description, address, phone, whatsapp, rating, image, promo, isPromoted } = req.body;
        const business = await Business.findById(req.params.id);
        if (business) {
            business.name = name || business.name;
            business.category = category || business.category;
            business.subcategory = subcategory !== undefined ? subcategory : business.subcategory;
            business.description = description || business.description;
            business.address = address || business.address;
            business.phone = phone || business.phone;
            business.whatsapp = whatsapp || business.whatsapp;
            business.rating = rating || business.rating;
            business.image = image || business.image;
            business.promo = promo || business.promo;
            if (isPromoted !== undefined) business.isPromoted = isPromoted;

            const updated = await business.save();
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Negocio no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/businesses/:id', async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        if (business) {
            await business.deleteOne();
            res.json({ message: 'Negocio eliminado' });
        } else {
            res.status(404).json({ message: 'Negocio no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- UTILIDADES DEL SISTEMA ---

// RESET COMPLETO DE LA BASE DE DATOS
router.delete('/reset', async (req, res) => {
    try {
        // Eliminar todas las colecciones relevantes
        await User.deleteMany({});
        await Job.deleteMany({});
        await Category.deleteMany({});
        await Article.deleteMany({});
        await Business.deleteMany({});

        res.json({ message: 'Base de datos reseteada completamente. Todos los datos han sido eliminados.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;