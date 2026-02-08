const mongoose = require('mongoose');

const businessSchema = mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String },
    subcategory: { type: String }, // Target specific subcategory
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    image: { type: String },
    isPromoted: { type: Boolean, default: false }, // Si es un anunciante pago
    rating: { type: Number, default: 0 },

    whatsapp: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Business', businessSchema);