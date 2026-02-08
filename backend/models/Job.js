const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    professional: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: String
    },
    location: {
        type: String, // Dirección simple por ahora
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'in_progress', 'completed', 'canceled', 'archived', 'rated'],
        default: 'active'
    },
    budget: {
        type: Number
    },
    images: [{
        type: String // URLs de imágenes
    }],
    offers: [{
        proId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        description: String,
        items: [{
            description: String,
            price: Number
        }],
        descriptionLine: String,
        duration: String,
        startDate: String,
        paymentTerms: String,
        currency: { type: String, default: '$' },
        warranty: String,
        conditions: String,
        observations: String,
        addTax: { type: Boolean, default: false },
        taxRate: Number,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        rejectionReason: String,
        createdAt: { type: Date, default: Date.now }
    }],
    conversations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }],
    trackingStatus: {
        type: String,
        enum: ['none', 'contracted', 'started', 'finished'],
        default: 'none'
    },
    workStartedOnTime: { type: Boolean },
    workPhotos: [{ type: String }],
    clientFinished: { type: Boolean, default: false },
    proFinished: { type: Boolean, default: false },
    clientRated: { type: Boolean, default: false },
    proRated: { type: Boolean, default: false },
    rating: { type: Number },
    review: { type: String },
    closureReason: { type: String }, // NEW: reason for closing the request
    hiredProId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // NEW: pro hired (if any)
    closedAt: { type: Date }, // NEW: timestamp of closure
    projectHistory: [{
        eventType: {
            type: String,
            enum: ['offer_accepted', 'work_started', 'photo_uploaded', 'note_added', 'date_negotiated', 'job_finished', 'pro_started'],
            required: true
        },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorRole: { type: String, enum: ['client', 'pro', 'system'] },
        timestamp: { type: Date, default: Date.now },
        title: String,
        description: String,
        mediaUrl: String,
        metadata: mongoose.Schema.Types.Mixed,
        isPrivate: { type: Boolean, default: false } // If true, only visible to actor until job completion
    }],
    clientManagement: {
        payments: [{
            date: { type: Date, default: Date.now },
            amount: Number,
            note: String,
            evidenceUrl: String
        }],
        beforePhotos: [{
            url: String,
            uploadedAt: { type: Date, default: Date.now }
        }],
        validatedStartDate: Date,
        validatedEndDate: Date,
        privateNotes: [{
            date: { type: Date, default: Date.now },
            text: String
        }],
        status: { type: String, enum: ['active', 'finished_by_client', 'appealed'], default: 'active' },
        appeal: {
            reason: String,
            evidence: [String],
            createdAt: Date
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índices para optimización de consultas
jobSchema.index({ client: 1 });
jobSchema.index({ professional: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 }); // Vital para ordenamiento

module.exports = mongoose.model('Job', jobSchema);
