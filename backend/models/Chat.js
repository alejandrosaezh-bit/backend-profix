const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    media: { type: String }, // Base64 string para imágenes
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const chatSchema = mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Opcional
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [messageSchema],
    lastMessage: { type: String },
    lastMessageDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
