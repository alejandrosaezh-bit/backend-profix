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
        const reviews = await Review.find({ reviewee: req.params.id })
            .populate('reviewer', 'name avatar') // Populate básico del autor
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Obtener reviews de un profesional (Alias para compatibilidad)
router.get('/professionals/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.id })
            .populate('reviewer', 'name avatar')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;