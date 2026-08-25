const express = require('express');
const router = express.Router();
const AppMessage = require('../models/AppMessage');
const { protect, admin } = require('../middleware/authMiddleware');

// GET all active messages
router.get('/', async (req, res) => {
    try {
        let messages = await AppMessage.find({ isActive: true });

        // If no messages exist, seed the defaults
        if (messages.length === 0) {
            const defaults = [
                {
                    title: "Soluciona tu problema o urgencia",
                    subtitle: "Publica tu necesidad y recibe propuestas rápidas de especialistas calificados cerca de ti.",
                    buttonText: "Publicar Solicitud"
                },
                {
                    title: "Conecta con profesionales en tu zona",
                    subtitle: "Describe lo que necesitas y notificaremos de inmediato a los expertos disponibles cerca de tu ubicación.",
                    buttonText: "Activar Búsqueda"
                },
                {
                    title: "Recibe presupuestos para tu proyecto",
                    subtitle: "Explícanos tu requerimiento y compara las mejores ofertas de profesionales verificados.",
                    buttonText: "Solicitar Presupuestos"
                },
                {
                    title: "Cualquier servicio, en un solo lugar",
                    subtitle: "Olvídate de buscar por horas. Envía tu solicitud y los especialistas vendrán a ti.",
                    buttonText: "Procesar Solicitud"
                },
                {
                    title: "¿Qué trabajo necesitas resolver hoy?",
                    subtitle: "Completa los datos del servicio para conectar al instante con el profesional ideal.",
                    buttonText: "Conectar con Profesionales"
                }
            ];
            messages = await AppMessage.insertMany(defaults);
        }

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET all messages (for admin, including inactive)
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const messages = await AppMessage.find().sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE a message
router.put('/:id', protect, admin, async (req, res) => {
    const { title, subtitle, buttonText, isActive } = req.body;

    // Build contact object
    const messageFields = {};
    if (title) messageFields.title = title;
    if (subtitle) messageFields.subtitle = subtitle;
    if (buttonText) messageFields.buttonText = buttonText;
    if (isActive !== undefined) messageFields.isActive = isActive;

    try {
        let message = await AppMessage.findById(req.params.id);

        if (!message) return res.status(404).json({ msg: 'Message not found' });

        message = await AppMessage.findByIdAndUpdate(
            req.params.id,
            { $set: messageFields },
            { new: true }
        );

        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
