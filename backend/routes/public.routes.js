const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Article = require('../models/Article');
const Business = require('../models/Business');
const Review = require('../models/Review');
const User = require('../models/User');
const Job = require('../models/Job');

// --- RUTAS PÚBLICAS (APP) ---

// 1. Obtener todas las categorías
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).lean();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Obtener artículos del blog
router.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 }).lean(); // Más recientes primero
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Obtener negocios/anunciantes
router.get('/businesses', async (req, res) => {
    try {
        const businesses = await Business.find();
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Obtener reviews de un usuario (Genérico, usado por Perfiles)
router.get('/users/:id/reviews', async (req, res) => {
    try {
        const allReviews = await Review.find({ reviewee: req.params.id, reviewerRole: 'pro' })
            .populate('reviewer', 'name avatar') // Populate básico del autor
            .populate({
                path: 'job',
                select: 'clientRated proRated status category title images workPhotos',
                populate: { path: 'category', select: 'name fullName' }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Solo mostrar reseñas si AMBAS partes han valorado
        const visibleReviews = allReviews.filter(r =>
            r.job && (
                (r.job.clientRated && r.job.proRated) ||
                (r.job.status === 'TERMINADO')
            )
        );

        res.json(visibleReviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Obtener reviews de un profesional (Alias para compatibilidad)
router.get('/professionals/:id/reviews', async (req, res) => {
    try {
        const allReviews = await Review.find({ reviewee: req.params.id, reviewerRole: 'client' })
            .populate('reviewer', 'name avatar')
            .populate({
                path: 'job',
                select: 'clientRated proRated status category title images workPhotos',
                populate: { path: 'category', select: 'name fullName' }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Solo mostrar reseñas si AMBAS partes han valorado
        const visibleReviews = allReviews.filter(r =>
            r.job && (
                (r.job.clientRated && r.job.proRated) ||
                (r.job.status === 'TERMINADO')
            )
        );

        res.json(visibleReviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 6. Obtener perfil público de profesional
router.get('/professionals/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name email avatar phone rating profiles createdAt role')
            .lean(); // Excluir password, etc.
        if (!user) return res.status(404).json({ message: 'Profesional no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 7. Solicitud Web de Servicio (Formulario Cliente)
router.post('/web-request', async (req, res) => {
    try {
        const { category, subcategory, title, location, description, name, email, phone } = req.body;
        
        if (!category || !location || !email) {
            return res.status(400).json({ message: 'Faltan datos obligatorios (category, location, email)' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name: name || 'Usuario Web',
                email,
                phone: phone || '',
                role: 'client'
            });
        }

        // Buscar categoría por ID (primero) o por nombre
        let categoryDoc = null;
        if (category.match(/^[0-9a-fA-F]{24}$/)) {
            categoryDoc = await Category.findById(category);
        } else {
            categoryDoc = await Category.findOne({ name: new RegExp(category, 'i') });
        }
        
        if (!categoryDoc) {
            categoryDoc = await Category.findOne(); 
        }
        if (!categoryDoc) {
             return res.status(400).json({ message: 'No hay categorías en el sistema' });
        }

        const job = await Job.create({
            client: user._id,
            title: title || `Solicitud Web: ${categoryDoc.name}`,
            description: description || `Servicio requerido en ${location}. Contactar para más detalles.`,
            category: categoryDoc._id,
            subcategory: subcategory || '',
            location: location,
            status: 'active'
        });

        res.status(201).json({ message: 'Solicitud creada con éxito', job: job._id });
    } catch (error) {
        console.error('Error en /web-request:', error);
        res.status(500).json({ message: error.message });
    }
});

// 8. Registro Web de Profesional (B2B Form)
router.post('/web-register', async (req, res) => {
    try {
        const { name, email, specialty, phone } = req.body;
        
        if (!name || !email) {
             return res.status(400).json({ message: 'Faltan datos obligatorios (name, email)' });
        }

        let user = await User.findOne({ email });
        if (user) {
             return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        user = await User.create({
            name,
            email,
            phone: phone || '',
            role: 'professional',
            specialties: specialty ? [specialty] : [],
            isVerified: false,
            verificationDetails: { status: 'pending', submittedAt: new Date() }
        });

        res.status(201).json({ message: 'Profesional registrado con éxito', user: user._id });
    } catch (error) {
        console.error('Error en /web-register:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;