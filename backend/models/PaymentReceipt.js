const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema({
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedPlan: { type: String, enum: ['PRO', 'ELITE'], required: true },
    amountUSD: { type: Number, required: true },
    amountVES: { type: Number, required: true }, 
    referenceNumber: { type: String, required: true, unique: true }, // Nro de Comprobante
    senderPhone: { type: String, required: true }, // Teléfono del Pago Móvil
    status: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED'], 
        default: 'PENDING' 
    },
    rejectionReason: { type: String },
    reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
});

module.exports = mongoose.model('PaymentReceipt', paymentReceiptSchema);
