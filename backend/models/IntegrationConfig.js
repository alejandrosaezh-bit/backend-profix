const mongoose = require('mongoose');

const integrationConfigSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true,
        default: 'iacondo',
        trim: true
    },
    apiUrl: {
        type: String,
        default: 'https://condopro-api.onrender.com/api/integrations/v1',
        trim: true
    },
    apiKey: {
        type: String,
        default: '',
        trim: true
    },
    condoSubdomain: {
        type: String,
        default: 'semeruco',
        trim: true
    },
    webhookUrl: {
        type: String,
        default: 'https://profix-backend-h56b.onrender.com/api/webhooks/iacondo-status',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastSyncAt: {
        type: Date
    },
    lastSyncStatus: {
        type: String,
        enum: ['idle', 'success', 'error'],
        default: 'idle'
    },
    lastSyncMessage: {
        type: String
    },
    stats: {
        quotesSent: { type: Number, default: 0 },
        quotesApproved: { type: Number, default: 0 },
        quotesRejected: { type: Number, default: 0 }
    },
    history: [{
        quoteNumber: String,
        jobTitle: String,
        amount: Number,
        currency: String,
        condoSubdomain: String,
        sentAt: { type: Date, default: Date.now },
        status: { type: String, default: 'sent' }, // sent, approved, rejected, error
        responseCode: Number,
        errorDetail: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('IntegrationConfig', integrationConfigSchema);
