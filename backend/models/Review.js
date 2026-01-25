const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewerRole: {
        type: String,
        enum: ['client', 'pro'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    // Preguntas específicas según quien califica
    answers: {
        paidOnTime: Boolean, // Para cliente
        clearInstructions: Boolean, // Para cliente
        deliveredOnTime: Boolean, // Para pro
        qualityAsExpected: Boolean, // Para pro
        professionalism: Boolean
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índice para asegurar que solo haya una reseña por hito/rol en un trabajo si fuera necesario
// Pero aquí permitimos una del cliente al pro y otra del pro al cliente.
reviewSchema.index({ job: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
