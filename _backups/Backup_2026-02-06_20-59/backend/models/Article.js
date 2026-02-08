const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true }, // Relacionado con Category
    image: { type: String },
    content: { type: String, required: true }, // Contenido HTML o Markdown
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Sistema de valoración del artículo
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    comments: [{
        user: { type: String }, // Nombre del usuario (o ID si está logueado)
        text: { type: String },
        rating: { type: Number },
        date: { type: Date, default: Date.now }
    }],
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);