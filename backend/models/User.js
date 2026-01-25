const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Opcional si usa Google
    googleId: { type: String, unique: true, sparse: true }, // ID de Google
    cedula: { type: String, unique: true, sparse: true }, // Cédula (Opcional con Google al inicio)
    role: { type: String, enum: ['client', 'professional', 'admin'], default: 'client' },
    phone: { type: String },
    avatar: { type: String },
    pushToken: { type: String },

    // Campos específicos para Profesionales
    isActive: { type: Boolean, default: true }, // Soft delete status
    isVerified: { type: Boolean, default: false }, // Verificación de identidad
    documents: [{ type: String }], // URLs de documentos subidos
    specialties: [{ type: String }], // Categorías que atiende (Legacy simple list)
    profiles: {
        type: Map,
        of: new mongoose.Schema({
            bio: String,
            subcategories: [String],
            zones: [String],
            gallery: [String],
            experience: String,
            priceRange: String,
            isActive: { type: Boolean, default: true }
        }, { _id: false })
    },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);