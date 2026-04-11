const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PaymentReceipt = require('../models/PaymentReceipt');
const { protect } = require('../middleware/authMiddleware');

const PLANS_PRICE_USD = {
    PRO: 20,
    ELITE: 50
};

// @desc    Solicitar Upgrade de Plan (Reportar Pago Móvil)
// @route   POST /api/subscriptions/upgrade
// @access  Private (Profesional)
router.post('/upgrade', protect, async (req, res) => {
    try {
        const { plan, amountVES, referenceNumber, senderPhone } = req.body;

        if (req.user.role !== 'professional') {
            return res.status(403).json({ message: 'Solo los profesionales pueden solicitar un upgrade.' });
        }

        if (!['PRO', 'ELITE'].includes(plan)) {
            return res.status(400).json({ message: 'Plan no válido.' });
        }

        if (!referenceNumber || !senderPhone || !amountVES) {
            return res.status(400).json({ message: 'Faltan datos del pago móvil (referencia, teléfono, o monto en Bs).' });
        }

        // Check if there is already a pending request
        const existingPending = await PaymentReceipt.findOne({
            professionalId: req.user._id,
            status: 'PENDING'
        });

        if (existingPending) {
            return res.status(400).json({ message: 'Ya tienes una solicitud de pago en revisión.' });
        }

        const receipt = new PaymentReceipt({
            professionalId: req.user._id,
            requestedPlan: plan,
            amountUSD: PLANS_PRICE_USD[plan],
            amountVES,
            referenceNumber,
            senderPhone,
            status: 'PENDING'
        });

        await receipt.save();

        // Actualizar estado del usuario
        await User.findByIdAndUpdate(req.user._id, {
            'subscription.status': 'PENDING_UPGRADE'
        });

        res.status(201).json({ message: 'Reporte de pago enviado a revisión.', receipt });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ese número de referencia ya fue reportado previamente.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener estatus de la suscripción actual
// @route   GET /api/subscriptions/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('subscription');
        
        let sub = user.subscription || { plan: 'FREE', status: 'ACTIVE', jobsUnlockedThisCycle: 0 };
        
        // Lazy Validation of 30-day Cycle
        const now = Date.now();
        const cycleStart = new Date(sub.cycleStartDate || now).getTime();
        const daysPassed = (now - cycleStart) / (1000 * 60 * 60 * 24);

        if (daysPassed >= 30) {
            // Check if plan expired
            if (sub.plan !== 'FREE' && sub.validUntil && new Date(sub.validUntil).getTime() < now) {
                 sub.plan = 'FREE';
                 sub.status = 'EXPIRED'; // or ACTIVE but FREE
            }
            sub.jobsUnlockedThisCycle = 0;
            sub.cycleStartDate = new Date();
            
            // Persist lazy update
            await User.findByIdAndUpdate(req.user._id, { subscription: sub });
        }

        const pendingPayment = await PaymentReceipt.findOne({ professionalId: req.user._id, status: 'PENDING' });

        res.json({
            subscription: sub,
            pendingPayment: pendingPayment ? true : false,
            limits: {
                FREE: 3,
                PRO: 10,
                ELITE: 999999
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
