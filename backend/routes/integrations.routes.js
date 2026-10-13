const express = require('express');
const router = express.Router();
const IacondoIntegrationService = require('../services/IacondoIntegrationService');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @desc    Obtener configuración actual de IACONDO
 * @route   GET /api/integrations/iacondo/config
 * @access  Private (Admin o Profesional)
 */
router.get('/iacondo/config', protect, async (req, res) => {
    try {
        const config = await IacondoIntegrationService.getConfig();

        // Enmascarar la API key si no es admin
        let maskedApiKey = '';
        if (config.apiKey) {
            if (req.user && req.user.role === 'admin') {
                maskedApiKey = config.apiKey; // El admin puede ver la clave completa
            } else {
                maskedApiKey = config.apiKey.length > 8 
                    ? `${config.apiKey.slice(0, 4)}••••••••${config.apiKey.slice(-4)}`
                    : '••••••••';
            }
        }

        res.json({
            success: true,
            config: {
                ...config,
                apiKey: maskedApiKey,
                hasApiKey: Boolean(config.apiKey)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Actualizar configuración de IACONDO
 * @route   PUT /api/integrations/iacondo/config
 * @access  Private (Solo Admin)
 */
router.put('/iacondo/config', protect, admin, async (req, res) => {
    try {
        const { apiUrl, apiKey, condoSubdomain, webhookUrl, isActive } = req.body;

        const updated = await IacondoIntegrationService.saveConfig({
            apiUrl,
            apiKey,
            condoSubdomain,
            webhookUrl,
            isActive
        });

        res.json({
            success: true,
            message: 'Configuración de IACONDO guardada exitosamente',
            config: {
                apiUrl: updated.apiUrl,
                condoSubdomain: updated.condoSubdomain,
                webhookUrl: updated.webhookUrl,
                isActive: updated.isActive,
                hasApiKey: Boolean(updated.apiKey)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Probar conexión técnica con IACONDO
 * @route   POST /api/integrations/iacondo/test-connection
 * @access  Private (Admin / Pro)
 */
router.post('/iacondo/test-connection', protect, async (req, res) => {
    try {
        const customConfig = req.body.apiUrl || req.body.apiKey ? {
            apiUrl: req.body.apiUrl,
            apiKey: req.body.apiKey,
            condoSubdomain: req.body.condoSubdomain,
            webhookUrl: req.body.webhookUrl
        } : null;

        const result = await IacondoIntegrationService.testConnection(customConfig);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Exportar cotización/presupuesto directo a IACONDO (Payload directo)
 * @route   POST /api/integrations/iacondo/send-quote
 * @access  Private (Pro o Admin)
 */
router.post('/iacondo/send-quote', protect, async (req, res) => {
    try {
        const quoteData = req.body;

        // Si el usuario es profesional y no envió info del profesional, usar sus datos
        if (req.user && req.user.role === 'professional') {
            if (!quoteData.professional) quoteData.professional = {};
            if (!quoteData.professional.name) quoteData.professional.name = req.user.name;
            if (!quoteData.professional.email) quoteData.professional.email = req.user.email;
            if (!quoteData.professional.phone) quoteData.professional.phone = req.user.phone;
            if (!quoteData.professional.legalId) quoteData.professional.legalId = req.user.cedula;
            if (quoteData.professional.rating === undefined) quoteData.professional.rating = req.user.rating || 5.0;
        }

        const result = await IacondoIntegrationService.sendQuoteToIacondo(quoteData);
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message,
            errors: error.errors || null,
            rawError: error.rawError || null
        });
    }
});

/**
 * @desc    Exportar un trabajo/oferta existente de Profesional Cercano a IACONDO
 * @route   POST /api/integrations/iacondo/export-job-offer
 * @access  Private (Pro o Admin)
 */
router.post('/iacondo/export-job-offer', protect, async (req, res) => {
    try {
        const { jobId, offerId, condoSubdomain, overrides = {} } = req.body;

        if (!jobId) {
            return res.status(400).json({ success: false, message: 'El campo jobId es obligatorio' });
        }

        if (condoSubdomain) {
            overrides.condoSubdomain = condoSubdomain;
        }

        // Construir payload a partir del Job y la Oferta
        const quotePayload = await IacondoIntegrationService.buildPayloadFromJobAndOffer(jobId, offerId, overrides);

        // Enviar a IACONDO
        const result = await IacondoIntegrationService.sendQuoteToIacondo(quotePayload);

        res.json({
            success: true,
            message: `Presupuesto ${result.quoteNumber} exportado a IACONDO exitosamente`,
            result
        });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message,
            errors: error.errors || null,
            rawError: error.rawError || null
        });
    }
});

/**
 * @desc    Historial de sincronización y cotizaciones enviadas
 * @route   GET /api/integrations/iacondo/history
 * @access  Private (Admin o Pro)
 */
router.get('/iacondo/history', protect, async (req, res) => {
    try {
        const IntegrationConfig = require('../models/IntegrationConfig');
        const config = await IntegrationConfig.findOne({ provider: 'iacondo' });
        
        res.json({
            success: true,
            stats: config?.stats || { quotesSent: 0, quotesApproved: 0, quotesRejected: 0 },
            history: (config?.history || []).reverse()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Webhook para recibir actualizaciones de estado desde IACONDO
 * @route   POST /api/webhooks/iacondo-status
 * @route   POST /api/integrations/webhook/iacondo-status
 * @access  Public (IACONDO Server)
 */
router.post(['/webhook/iacondo-status', '/iacondo-status'], async (req, res) => {
    try {
        const result = await IacondoIntegrationService.handleWebhookUpdate(req.body);
        res.status(200).json({
            received: true,
            ...result
        });
    } catch (error) {
        console.error('[IACONDO WEBHOOK ERROR]:', error.message);
        res.status(400).json({
            received: false,
            message: error.message
        });
    }
});

module.exports = router;
