const mongoose = require('mongoose');

const jobInteractionSchema = mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['new', 'viewed', 'contacted', 'offered', 'won', 'lost', 'rejected', 'archived'],
        default: 'new'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    hasUnread: {
        type: Boolean,
        default: false
    }
});

// Índice único para evitar duplicados por par job-user
jobInteractionSchema.index({ job: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('JobInteraction', jobInteractionSchema);
