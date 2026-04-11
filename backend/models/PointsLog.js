const mongoose = require('mongoose');

const pointsLogSchema = new mongoose.Schema({
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    season: { type: String, required: true }, // Ej: "2026-Q1"
    actionType: { 
        type: String, 
        enum: [
            'FIRST_TO_GREET',
            'FIRST_TO_QUOTE',
            'QUOTE_WON',
            'JOB_COMPLETED_IN_TIME',
            'REVIEW_5_STAR', 
            'REVIEW_4_STAR', 
            'REVIEW_POOR'
        ],
        required: true 
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID del Job, Chat o Review
    basePoints: { type: Number, required: true },
    multiplier: { type: Number, default: 1.0 },
    finalPoints: { type: Number, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

// Índice para consultas rápidas por profesional y temporada
pointsLogSchema.index({ professionalId: 1, season: 1 });

module.exports = mongoose.model('PointsLog', pointsLogSchema);
