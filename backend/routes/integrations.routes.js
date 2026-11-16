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
        const result = await IacondoIntegrationService.handleWebhookUpdate({
            ...req.body,
            io: req.app.get('socketio')
        });
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

/**
 * @desc    Listar todos los condominios de IACONDO dados de alta como Clientes en Profesional Cercano
 * @route   GET /api/integrations/iacondo/condos
 * @access  Private (Admin o Pro)
 */
router.get('/iacondo/condos', protect, async (req, res) => {
    try {
        const condos = await IacondoIntegrationService.getSyncedCondoClients();
        res.json({
            success: true,
            count: condos.length,
            condos
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Consultar la API de IACONDO y dar de alta automáticamente todos los condominios activos
 * @route   POST /api/integrations/iacondo/condos/pull
 * @access  Private (Admin)
 */
router.post('/iacondo/condos/pull', protect, admin, async (req, res) => {
    try {
        const result = await IacondoIntegrationService.pullActiveCondosFromIacondo();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Dar de alta o sincronizar uno o múltiples condominios activos como Clientes (Push desde IACONDO o Admin)
 * @route   POST /api/integrations/iacondo/condos/sync
 * @route   POST /api/webhooks/iacondo-condos
 * @access  Webhook (x-api-key) o Admin (Bearer Token)
 */
router.post(['/iacondo/condos/sync', '/webhook/iacondo-condos', '/iacondo-condos'], async (req, res) => {
    try {
        // Validar autenticación: o viene x-api-key válida o viene token JWT
        const config = await IacondoIntegrationService.getConfig();
        const incomingApiKey = req.headers['x-api-key'];
        const authHeader = req.headers.authorization;

        let isAuthorized = false;
        if (config.apiKey && incomingApiKey && incomingApiKey === config.apiKey) {
            isAuthorized = true;
        } else if (authHeader && authHeader.startsWith('Bearer ')) {
            const jwt = require('jsonwebtoken');
            try {
                const token = authHeader.split(' ')[1];
                jwt.verify(token, process.env.JWT_SECRET);
                isAuthorized = true;
            } catch (e) {
                isAuthorized = false;
            }
        } else if (!config.apiKey) {
            // Si aún no hay API key configurada, permitir sincronización inicial
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado. Proporcione un x-api-key válido o token de administrador.'
            });
        }

        const payload = req.body.condos || req.body.condominiums || req.body.data || req.body;
        const result = await IacondoIntegrationService.syncCondosBatch(payload);

        res.status(200).json({
            success: true,
            message: `Sincronización completada: ${result.createdCount} nuevos condominios registrados como clientes, ${result.updatedCount} actualizados.`,
            ...result
        });
    } catch (error) {
        console.error('[IACONDO CONDO SYNC ERROR]:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Listar vecinos de IACONDO dados de alta como Clientes Particulares en Profesional Cercano
 * @route   GET /api/integrations/iacondo/residents
 * @access  Private (Admin)
 */
router.get('/iacondo/residents', protect, admin, async (req, res) => {
    try {
        const residents = await IacondoIntegrationService.getSyncedResidentClients();
        res.json({
            success: true,
            count: residents.length,
            residents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Dar de alta o sincronizar uno o múltiples vecinos de IACONDO como Clientes Particulares
 * @route   POST /api/integrations/iacondo/residents/sync
 * @route   POST /api/webhooks/iacondo-residents
 * @access  Webhook (x-api-key / origen IACONDO) o Admin (Bearer Token)
 */
router.post(['/iacondo/residents/sync', '/webhook/iacondo-residents', '/iacondo-residents'], async (req, res) => {
    try {
        const config = await IacondoIntegrationService.getConfig();
        const incomingApiKey = req.headers['x-api-key'];
        const authHeader = req.headers.authorization;

        let isAuthorized = false;
        if (config.apiKey && incomingApiKey && incomingApiKey === config.apiKey) {
            isAuthorized = true;
        } else if (authHeader && authHeader.startsWith('Bearer ')) {
            const jwt = require('jsonwebtoken');
            try {
                const token = authHeader.split(' ')[1];
                jwt.verify(token, process.env.JWT_SECRET);
                isAuthorized = true;
            } catch (_) {
                isAuthorized = false;
            }
        } else if (!config.apiKey) {
            isAuthorized = true;
        }

        // Permitir alta automática si el condominio origen ya existe y está activo en Profesional Cercano
        if (!isAuthorized) {
            const User = require('../models/User');
            const rawItems = Array.isArray(req.body?.residents) ? req.body.residents : [req.body?.resident || req.body];
            const firstSub = IacondoIntegrationService.normalizeSubdomain(
                req.body?.condo?.subdomain ||
                req.body?.condoSubdomain ||
                rawItems[0]?.condoSubdomain ||
                ''
            );
            if (firstSub) {
                const knownCondo = await User.findOne({
                    'externalIntegration.subdomain': firstSub,
                    clientType: 'condominio',
                    isActive: true
                }).select('_id').lean();
                if (knownCondo) {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado para sincronizar residentes.'
            });
        }

        const residentsPayload = req.body?.residents || req.body?.resident || req.body?.data || req.body;
        const defaultCondoContext = req.body?.condo || {};
        const result = await IacondoIntegrationService.syncResidentsBatch(residentsPayload, defaultCondoContext);

        res.status(200).json({
            success: true,
            message: `Sincronización de vecinos completada: ${result.createdCount} nuevos clientes particulares creados, ${result.updatedCount} actualizados.`,
            ...result
        });
    } catch (error) {
        console.error('[IACONDO RESIDENT SYNC ERROR]:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    Catálogo vivo de Categorías y Subcategorías activas para condominios en IACONDO
 * @route   GET /api/integrations/iacondo/categories
 * @access  Public / Integración
 */
router.get('/iacondo/categories', async (req, res) => {
    try {
        const Category = require('../models/Category');
        const categories = await Category.find({ isActive: true })
            .select('-subcategories.emergencyIcon')
            .sort({ name: 1 })
            .lean();
        res.json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Recibir una Solicitud de Reparación o Mejora desde CUALQUIER Condominio en IACONDO
 *          Auto-registra el condominio como Cliente si no existía y publica el Job en Profesional Cercano.
 * @route   POST /api/integrations/iacondo/service-requests
 * @route   POST /api/webhooks/iacondo-service-request
 * @access  Webhook (x-api-key) o Admin/Client
 */
router.post(['/iacondo/service-requests', '/webhook/iacondo-service-request', '/iacondo-service-request'], async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const result = await IacondoIntegrationService.createServiceRequestFromIacondo(req.body, io);
        res.status(result.isUpdate ? 200 : 201).json({
            success: true,
            message: result.isUpdate
                ? `Solicitud actualizada exitosamente en Profesional Cercano para ${result.condoClient.name}`
                : `Solicitud publicada exitosamente para ${result.condoClient.name} (subdominio: ${result.condoClient.subdomain})`,
            ...result
        });
    } catch (error) {
        console.error('[IACONDO SERVICE REQUEST ERROR]:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    FASE 2 & 3 — Hub en vivo de Presupuestos y Chats de una solicitud de Condominio
 * @route   GET /api/integrations/iacondo/jobs/:jobId/hub
 */
router.get('/iacondo/jobs/:jobId/hub', async (req, res) => {
    try {
        const result = await IacondoIntegrationService.getCondoJobHub(req.params.jobId, {
            condoSubdomain: req.query.condoSubdomain || req.headers['x-condo-subdomain'],
            externalRequestId: req.query.externalRequestId || req.headers['x-external-request-id'],
            apiKey: req.headers['x-api-key']
        });
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    FASE 3 — Obtener o iniciar Chat entre el Condominio y un Profesional postulado
 * @route   GET /api/integrations/iacondo/jobs/:jobId/chats/:proId
 */
router.get('/iacondo/jobs/:jobId/chats/:proId', async (req, res) => {
    try {
        const result = await IacondoIntegrationService.getOrOpenCondoJobChat(
            req.params.jobId,
            req.params.proId,
            {
                condoSubdomain: req.query.condoSubdomain || req.headers['x-condo-subdomain'],
                externalRequestId: req.query.externalRequestId || req.headers['x-external-request-id'],
                apiKey: req.headers['x-api-key']
            }
        );
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    FASE 3 — Enviar mensaje / imagen / Pase QR desde el Condominio al Profesional
 * @route   POST /api/integrations/iacondo/jobs/:jobId/chats/:proId/messages
 */
router.post('/iacondo/jobs/:jobId/chats/:proId/messages', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const result = await IacondoIntegrationService.sendCondoJobChatMessage(
            req.params.jobId,
            req.params.proId,
            req.body,
            {
                condoSubdomain: req.body?.condoSubdomain || req.query.condoSubdomain || req.headers['x-condo-subdomain'],
                externalRequestId: req.body?.externalRequestId || req.query.externalRequestId || req.headers['x-external-request-id'],
                apiKey: req.headers['x-api-key']
            },
            io
        );
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    FASE 2 — Adjudicar oferta ganadora desde IACONDO al Profesional en Profesional Cercano
 * @route   POST /api/integrations/iacondo/jobs/:jobId/assign
 */
router.post('/iacondo/jobs/:jobId/assign', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const result = await IacondoIntegrationService.assignCondoJobOffer(
            req.params.jobId,
            req.body,
            {
                condoSubdomain: req.body?.condoSubdomain || req.query.condoSubdomain || req.headers['x-condo-subdomain'],
                externalRequestId: req.body?.externalRequestId || req.query.externalRequestId || req.headers['x-external-request-id'],
                apiKey: req.headers['x-api-key']
            },
            io
        );
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @desc    FASE 2 — Cerrar como Solucionado y calificar con ⭐ al Profesional desde IACONDO
 * @route   POST /api/integrations/iacondo/jobs/:jobId/complete-and-rate
 */
router.post('/iacondo/jobs/:jobId/complete-and-rate', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const result = await IacondoIntegrationService.completeAndRateCondoJob(
            req.params.jobId,
            req.body,
            {
                condoSubdomain: req.body?.condoSubdomain || req.query.condoSubdomain || req.headers['x-condo-subdomain'],
                externalRequestId: req.body?.externalRequestId || req.query.externalRequestId || req.headers['x-external-request-id'],
                apiKey: req.headers['x-api-key']
            },
            io
        );
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
