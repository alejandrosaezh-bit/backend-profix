const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Ej: "Hogar"
    icon: { type: String }, // Nombre del icono o URL
    color: { type: String }, // Color de fondo
    subcategories: [{
        name: { type: String, required: true },
        icon: { type: String }, // Icono específico
        titlePlaceholder: { type: String }, // Ej para el input Título
        descriptionPlaceholder: { type: String }, // Ej para el input Descripción
        isUrgent: { type: Boolean, default: false }
    }],
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Category', categorySchema);