const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Ej: "Hogar"
    icon: { type: String }, // Nombre del icono o URL
    color: { type: String }, // Color de fondo
    subcategories: [{ type: String }], // Ej: ["Plomería", "Electricidad"]
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Category', categorySchema);