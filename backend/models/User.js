const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Opcional si usa Google
    googleId: { type: String, unique: true, sparse: true }, // ID de Google
    cedula: { type: String, unique: true, sparse: true }, // Cédula (Opcional con Google al inicio)
    role: { type: String, enum: ['client', 'professional', 'admin'], default: 'client' },
    phone: { type: String },
    avatar: { type: String },
    pushToken: { type: String },
    resetPasswordCode: { type: String }, // For password recovery
    resetPasswordExpire: { type: Date },

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
    
    // Sistema de Gamificación - Temporadas Trimestrales
    gamification: {
        currentLevel: { 
            type: Number, 
            enum: [1, 2, 3, 4], 
            default: 1 
        },
        projectedLevel: { 
            type: Number, 
            enum: [1, 2, 3, 4], 
            default: 1 
        },
        currentSeasonPoints: { type: Number, default: 0 },
        lastSeasonReset: { type: Date }
    },
    
    // Monetización - Planes de Suscripción (FREE, PRO, ELITE)
    subscription: {
        plan: { 
            type: String, 
            enum: ['FREE', 'PRO', 'ELITE'], 
            default: 'FREE' 
        },
        status: { 
            type: String, 
            enum: ['ACTIVE', 'PENDING_UPGRADE', 'EXPIRED'], 
            default: 'ACTIVE' 
        },
        validUntil: { type: Date }, // Fecha de corte del mes
        jobsUnlockedThisCycle: { type: Number, default: 0 }, // Consumidos en el mes de este plan
        cycleStartDate: { type: Date, default: Date.now } // Ultimo reseteo de contador
    },
    
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    // Preferencias de Notificaciones
    notificationPreferences: {
        // CLIENT PREFERENCES
        client_new_messages: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        client_new_quotes: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        client_status_updates: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        client_reviews: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        
        // PROFESSIONAL PREFERENCES
        prof_new_requests: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        prof_new_messages: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        prof_quote_responses: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        prof_status_updates: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } },
        prof_reviews: { push: { type: Boolean, default: true }, email: { type: Boolean, default: true } }
    },

    createdAt: { type: Date, default: Date.now }
});
// Indexes for performance optimization on common search fields
userSchema.index({ role: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);