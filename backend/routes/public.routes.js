const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Article = require('../models/Article');
const Business = require('../models/Business');
const Review = require('../models/Review');
const User = require('../models/User');

// --- RUTAS PÚBLICAS (APP) ---

// 1. Obtener todas las categorías
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Obtener artículos del blog
router.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 }); // Más recientes primero
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
            .populate('job', 'clientRated proRated status') // Traer datos del trabajo
            .sort({ createdAt: -1 })
            .lean();

        // Solo mostrar reseñas si AMBAS partes han valorado
        const visibleReviews = allReviews.filter(r =>
            !r.job || // Si por alguna razón no hay trabajo (legacy), dejar pasar? o bloquear? mejor dejar pasar para no romper legacy
            (r.job.clientRated && r.job.proRated) ||
            (r.job.status === 'TERMINADO')
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
            .populate('job', 'clientRated proRated status')
            .sort({ createdAt: -1 })
            .lean();

        // Solo mostrar reseñas si AMBAS partes han valorado
        const visibleReviews = allReviews.filter(r =>
            !r.job ||
            (r.job.clientRated && r.job.proRated) ||
            (r.job.status === 'TERMINADO')
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
            .select('name email avatar phone rating profiles createdAt role'); // Excluir password, etc.
        if (!user) return res.status(404).json({ message: 'Profesional no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;