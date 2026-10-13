const axios = require('axios');
const IntegrationConfig = require('../models/IntegrationConfig');
const Job = require('../models/Job');
const User = require('../models/User');

class IacondoIntegrationService {
    /**
     * Obtiene la configuración actual de IACONDO desde MongoDB
     * con fallback a variables de entorno.
     */
    static async getConfig() {
        let configDoc = null;
        try {
            configDoc = await IntegrationConfig.findOne({ provider: 'iacondo' });
        } catch (err) {
            console.warn('[IACONDO] Error consultando IntegrationConfig en DB, usando defaults/env:', err.message);
        }

        const apiUrl = (configDoc && configDoc.apiUrl) || 
                       process.env.IACONDO_API_URL || 
                       'https://condopro-api.onrender.com/api/integrations/v1';

        const apiKey = (configDoc && configDoc.apiKey) || 
                       process.env.IACONDO_API_KEY || 
                       '';

        const condoSubdomain = (configDoc && configDoc.condoSubdomain) || 
                               process.env.CONDO_SUBDOMAIN || 
                               'semeruco';

        const webhookUrl = (configDoc && configDoc.webhookUrl) || 
                           process.env.IACONDO_WEBHOOK_URL || 
                           'https://profix-backend-h56b.onrender.com/api/webhooks/iacondo-status';

        return {
            apiUrl: apiUrl.replace(/\/+$/, ''), // Sin slash final
            apiKey: apiKey.trim(),
            condoSubdomain: condoSubdomain.trim(),
            webhookUrl: webhookUrl.trim(),
            isActive: configDoc ? configDoc.isActive : true,
            stats: configDoc ? configDoc.stats : { quotesSent: 0, quotesApproved: 0, quotesRejected: 0 },
            lastSyncAt: configDoc?.lastSyncAt,
            lastSyncStatus: configDoc?.lastSyncStatus || 'idle',
            lastSyncMessage: configDoc?.lastSyncMessage || ''
        };
    }

    /**
     * Guarda o actualiza la configuración de IACONDO en la base de datos.
     */
    static async saveConfig(data) {
        const update = {};
        if (data.apiUrl !== undefined) update.apiUrl = data.apiUrl.trim().replace(/\/+$/, '');
        if (data.apiKey !== undefined) update.apiKey = data.apiKey.trim();
        if (data.condoSubdomain !== undefined) update.condoSubdomain = data.condoSubdomain.trim();
        if (data.webhookUrl !== undefined) update.webhookUrl = data.webhookUrl.trim();
        if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);

        const configDoc = await IntegrationConfig.findOneAndUpdate(
            { provider: 'iacondo' },
            { $set: update },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return configDoc;
    }

    /**
     * Valida la estructura requerida del payload según el contrato de datos.
     */
    static validateQuotePayload(payload) {
        const errors = [];

        if (!payload || typeof payload !== 'object') {
            return { isValid: false, errors: ['El cuerpo de la petición debe ser un objeto JSON válido'] };
        }

        if (!payload.condoSubdomain || typeof payload.condoSubdomain !== 'string') {
            errors.push('El campo "condoSubdomain" es obligatorio (ej: "semeruco")');
        }

        if (!payload.serviceCategory || typeof payload.serviceCategory !== 'string') {
            errors.push('El campo "serviceCategory" es obligatorio');
        }

        if (!payload.jobTitle || typeof payload.jobTitle !== 'string') {
            errors.push('El campo "jobTitle" es obligatorio');
        }

        if (!payload.jobDescription || typeof payload.jobDescription !== 'string') {
            errors.push('El campo "jobDescription" es obligatorio');
        }

        const validUrgencies = ['BAJA', 'NORMAL', 'ALTA', 'EMERGENCIA'];
        if (payload.urgency && !validUrgencies.includes(payload.urgency.toUpperCase())) {
            errors.push(`El campo "urgency" debe ser uno de: ${validUrgencies.join(', ')}`);
        }

        if (!payload.professional || typeof payload.professional !== 'object') {
            errors.push('El objeto "professional" es obligatorio');
        } else {
            if (!payload.professional.name) {
                errors.push('El campo "professional.name" es obligatorio');
            }
        }

        if (!payload.quote || typeof payload.quote !== 'object') {
            errors.push('El objeto "quote" es obligatorio');
        } else {
            if (!payload.quote.quoteNumber) {
                errors.push('El campo "quote.quoteNumber" es obligatorio');
            }
            if (payload.quote.amount === undefined || isNaN(Number(payload.quote.amount))) {
                errors.push('El campo "quote.amount" debe ser un número válido');
            }
            if (payload.quote.currency && !['USD', 'VES'].includes(payload.quote.currency.toUpperCase())) {
                errors.push('El campo "quote.currency" debe ser "USD" o "VES"');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Formatea el payload para garantizar que coincida exactamente con el contrato JSON.
     */
    static formatQuotePayload(inputData, config) {
        const urgencyInput = (inputData.urgency || 'NORMAL').toUpperCase();
        const validUrgencies = ['BAJA', 'NORMAL', 'ALTA', 'EMERGENCIA'];
        const urgency = validUrgencies.includes(urgencyInput) ? urgencyInput : 'NORMAL';

        const currencyInput = (inputData.quote?.currency || 'USD').toUpperCase();
        const currency = currencyInput === 'VES' || currencyInput === 'BS' ? 'VES' : 'USD';

        const amount = Number(inputData.quote?.amount || 0);
        const laborCost = inputData.quote?.laborCost !== undefined ? Number(inputData.quote.laborCost) : amount;
        const materialsCost = inputData.quote?.materialsCost !== undefined ? Number(inputData.quote.materialsCost) : 0;

        return {
            condoSubdomain: (inputData.condoSubdomain || config.condoSubdomain || 'semeruco').trim(),
            sourceApp: inputData.sourceApp || 'ProfesionalCercano',
            serviceCategory: (inputData.serviceCategory || 'Servicios Generales').trim(),
            jobTitle: (inputData.jobTitle || 'Mantenimiento / Reparación').trim(),
            jobDescription: (inputData.jobDescription || 'Trabajo técnico solicitado a través de Profesional Cercano').trim(),
            urgency,
            professional: {
                name: (inputData.professional?.name || 'Profesional').trim(),
                legalId: (inputData.professional?.legalId || 'Sin registrar').trim(),
                phone: (inputData.professional?.phone || '').trim(),
                email: (inputData.professional?.email || '').trim(),
                rating: Number(inputData.professional?.rating || 5.0)
            },
            quote: {
                quoteNumber: (inputData.quote?.quoteNumber || `PC-${Date.now().toString().slice(-6)}`).trim(),
                amount: Number(amount.toFixed(2)),
                currency,
                laborCost: Number(laborCost.toFixed(2)),
                materialsCost: Number(materialsCost.toFixed(2)),
                pdfUrl: inputData.quote?.pdfUrl || '',
                photos: Array.isArray(inputData.quote?.photos) ? inputData.quote.photos : [],
                validUntil: inputData.quote?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            webhookUrl: inputData.webhookUrl || config.webhookUrl
        };
    }

    /**
     * SERVICIO DE EXPORTACIÓN PRINCIPAL:
     * Envía una cotización a la API REST de IACONDO.
     * POST {IACONDO_API_URL}/maintenance-quotes
     * Headers:
     *   Content-Type: application/json
     *   x-api-key: {IACONDO_API_KEY}
     */
    static async sendQuoteToIacondo(quoteData, customConfig = null) {
        const config = customConfig || await this.getConfig();

        if (!config.apiKey) {
            throw new Error('No se ha configurado la API Key de IACONDO (IACONDO_API_KEY). Por favor configúrala en el panel.');
        }

        // Formatear y asegurar contrato
        const payload = this.formatQuotePayload(quoteData, config);

        // Validar contrato
        const validation = this.validateQuotePayload(payload);
        if (!validation.isValid) {
            const err = new Error(`Validación de cotización fallida: ${validation.errors.join('; ')}`);
            err.status = 400;
            err.errors = validation.errors;
            throw err;
        }

        const endpoint = `${config.apiUrl}/maintenance-quotes`;

        console.log(`[IACONDO] Enviando cotización ${payload.quote.quoteNumber} a: ${endpoint}`);
        console.log(`[IACONDO] Subdominio: ${payload.condoSubdomain} | Monto: ${payload.quote.amount} ${payload.quote.currency}`);

        let response = null;
        let errorDetail = null;

        try {
            response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey
                },
                timeout: 15000 // 15 segundos timeout
            });

            console.log(`[IACONDO] Respuesta exitosa (${response.status}):`, response.data);

            // Actualizar estadísticas y registro histórico en base de datos
            await this.recordSyncResult({
                status: 'success',
                quoteNumber: payload.quote.quoteNumber,
                jobTitle: payload.jobTitle,
                amount: payload.quote.amount,
                currency: payload.quote.currency,
                condoSubdomain: payload.condoSubdomain,
                responseCode: response.status,
                message: `Cotización ${payload.quote.quoteNumber} exportada exitosamente`
            });

            return {
                success: true,
                status: response.status,
                quoteNumber: payload.quote.quoteNumber,
                endpoint,
                data: response.data,
                payloadSent: payload
            };
        } catch (error) {
            const statusCode = error.response?.status;
            const responseData = error.response?.data;
            errorDetail = responseData ? (typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData)) : error.message;

            console.error(`[IACONDO] Error enviando cotización a IACONDO:`, {
                status: statusCode,
                message: error.message,
                data: responseData
            });

            // Registrar fallo en base de datos
            await this.recordSyncResult({
                status: 'error',
                quoteNumber: payload.quote.quoteNumber,
                jobTitle: payload.jobTitle,
                amount: payload.quote.amount,
                currency: payload.quote.currency,
                condoSubdomain: payload.condoSubdomain,
                responseCode: statusCode || 500,
                errorDetail,
                message: `Error al conectar con IACONDO: ${error.message}`
            });

            let userFriendlyMsg = `Error al exportar a IACONDO (${statusCode || 'Conexión'}): `;
            if (statusCode === 401 || statusCode === 403) {
                userFriendlyMsg += 'API Key no válida o sin permisos para el condominio especificado.';
            } else if (statusCode === 404) {
                userFriendlyMsg += `Endpoint no encontrado en ${endpoint}. Verifica la URL base de IACONDO.`;
            } else if (statusCode === 400 || statusCode === 422) {
                userFriendlyMsg += `Datos rechazados por IACONDO: ${errorDetail}`;
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                userFriendlyMsg += 'Tiempo de espera agotado al conectar con el servidor de IACONDO.';
            } else {
                userFriendlyMsg += error.message;
            }

            const exportError = new Error(userFriendlyMsg);
            exportError.status = statusCode || 502;
            exportError.rawError = errorDetail;
            exportError.payloadSent = payload;
            throw exportError;
        }
    }

    /**
     * Mapea un Job existente y una de sus Ofertas de Profesional Cercano
     * al formato exacto requerido por IACONDO.
     */
    static async buildPayloadFromJobAndOffer(jobId, offerId, overrides = {}) {
        const job = await Job.findById(jobId)
            .populate('category')
            .populate('offers.proId')
            .populate('client', 'name email phone');

        if (!job) {
            throw new Error(`Trabajo con ID ${jobId} no encontrado`);
        }

        let offer = null;
        if (offerId) {
            offer = job.offers.id(offerId) || job.offers.find(o => o._id.toString() === offerId.toString());
        } else if (job.offers.length > 0) {
            // Si no se especifica offerId, tomar la primera o la aceptada
            offer = job.offers.find(o => o.status === 'accepted') || job.offers[0];
        }

        const proUser = offer?.proId || {};

        const serviceCategory = job.category?.name 
            ? `${job.category.name}${job.subcategory ? ' - ' + job.subcategory : ''}`
            : (job.subcategory || 'Mantenimiento General');

        const urgencyMap = {
            true: 'EMERGENCIA',
            false: 'NORMAL'
        };
        const defaultUrgency = job.isUrgent ? 'EMERGENCIA' : 'NORMAL';

        // Calcular desglose de costos si la oferta tiene items
        let laborCost = offer ? Number(offer.amount || 0) : Number(job.budget || 0);
        let materialsCost = 0;

        if (offer?.items && Array.isArray(offer.items) && offer.items.length > 0) {
            const sumItems = offer.items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
            if (sumItems > 0) {
                laborCost = sumItems;
            }
        }

        const dateCode = new Date().getFullYear();
        const shortJobId = job._id.toString().slice(-4).toUpperCase();
        const quoteNumber = overrides.quoteNumber || `PC-${dateCode}-${shortJobId}`;

        // Determinar imágenes del trabajo para adjuntar en photos
        const photos = [];
        if (Array.isArray(job.images)) {
            photos.push(...job.images.filter(img => typeof img === 'string' && img.startsWith('http')));
        }
        if (Array.isArray(job.workPhotos)) {
            photos.push(...job.workPhotos.filter(img => typeof img === 'string' && img.startsWith('http')));
        }

        const rawPayload = {
            condoSubdomain: overrides.condoSubdomain,
            sourceApp: 'ProfesionalCercano',
            serviceCategory: overrides.serviceCategory || serviceCategory,
            jobTitle: overrides.jobTitle || job.title,
            jobDescription: overrides.jobDescription || job.description,
            urgency: overrides.urgency || defaultUrgency,
            professional: {
                name: overrides.proName || proUser.name || 'Profesional Certificado',
                legalId: overrides.proLegalId || proUser.cedula || 'V-00000000',
                phone: overrides.proPhone || proUser.phone || '',
                email: overrides.proEmail || proUser.email || '',
                rating: overrides.proRating !== undefined ? overrides.proRating : (proUser.rating || 5.0)
            },
            quote: {
                quoteNumber,
                amount: overrides.amount !== undefined ? overrides.amount : (offer?.amount || job.budget || 0),
                currency: overrides.currency || (offer?.currency === 'Bs' || offer?.currency === 'VES' ? 'VES' : 'USD'),
                laborCost: overrides.laborCost !== undefined ? overrides.laborCost : laborCost,
                materialsCost: overrides.materialsCost !== undefined ? overrides.materialsCost : materialsCost,
                pdfUrl: overrides.pdfUrl || '',
                photos: overrides.photos || photos.slice(0, 5),
                validUntil: overrides.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            webhookUrl: overrides.webhookUrl
        };

        return rawPayload;
    }

    /**
     * Prueba la conexión con el servidor de IACONDO.
     */
    static async testConnection(customConfig = null) {
        const config = customConfig || await this.getConfig();

        if (!config.apiUrl) {
            return { success: false, message: 'La URL de la API de IACONDO no está definida' };
        }
        if (!config.apiKey) {
            return { success: false, message: 'La API Key de IACONDO no está configurada' };
        }

        // Construir cotización de prueba (Ping técnico)
        const testPayload = {
            condoSubdomain: config.condoSubdomain || 'semeruco',
            sourceApp: 'ProfesionalCercano',
            serviceCategory: 'Prueba Técnica de Conexión',
            jobTitle: 'Ping de Integración Profesional Cercano',
            jobDescription: 'Verificación de conectividad y autenticación x-api-key entre Profesional Cercano e IACONDO',
            urgency: 'BAJA',
            professional: {
                name: 'Profesional Cercano Bot',
                legalId: 'J-00000000-0',
                phone: '0000-0000000',
                email: 'soporte@profesionalcercano.com',
                rating: 5.0
            },
            quote: {
                quoteNumber: `PC-PING-${Date.now().toString().slice(-6)}`,
                amount: 1.00,
                currency: 'USD',
                laborCost: 1.00,
                materialsCost: 0.00,
                photos: [],
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            webhookUrl: config.webhookUrl
        };

        const endpoint = `${config.apiUrl}/maintenance-quotes`;

        try {
            console.log(`[IACONDO] Ejecutando test de conexión a ${endpoint}`);
            const response = await axios.post(endpoint, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey
                },
                timeout: 10000
            });

            return {
                success: true,
                status: response.status,
                message: 'Conexión exitosa con IACONDO. API Key y subdominio validados.',
                data: response.data
            };
        } catch (error) {
            const statusCode = error.response?.status;
            let message = error.message;

            if (statusCode === 401 || statusCode === 403) {
                message = 'Error de autenticación (401/403): La API Key no es válida o no tiene permisos en IACONDO.';
            } else if (statusCode === 404) {
                message = `Endpoint no encontrado (404) en ${endpoint}. Revisa la URL base.`;
            } else if (error.response?.data?.message) {
                message = `IACONDO respondió (${statusCode}): ${error.response.data.message}`;
            }

            return {
                success: false,
                status: statusCode || 500,
                message,
                raw: error.response?.data || error.message
            };
        }
    }

    /**
     * Procesa una actualización recibida a través del Webhook de IACONDO
     * POST /api/webhooks/iacondo-status
     */
    static async handleWebhookUpdate(webhookData) {
        console.log('[IACONDO WEBHOOK] Datos recibidos:', webhookData);

        const { quoteNumber, status, approvedAmount, notes, condoSubdomain } = webhookData;

        if (!quoteNumber) {
            throw new Error('El campo "quoteNumber" es obligatorio en el webhook');
        }

        const normalizedStatus = (status || '').toUpperCase();
        let isApproved = normalizedStatus === 'APPROVED' || normalizedStatus === 'APROBADO';
        let isRejected = normalizedStatus === 'REJECTED' || normalizedStatus === 'RECHAZADO';

        // Actualizar estadísticas y estado en IntegrationConfig
        try {
            const incField = isApproved 
                ? { 'stats.quotesApproved': 1 } 
                : (isRejected ? { 'stats.quotesRejected': 1 } : {});

            await IntegrationConfig.findOneAndUpdate(
                { provider: 'iacondo' },
                {
                    $inc: incField,
                    $set: {
                        lastSyncAt: new Date(),
                        lastSyncStatus: isApproved ? 'success' : (isRejected ? 'error' : 'idle'),
                        lastSyncMessage: `Webhook recibido para cotización ${quoteNumber}: ${status}`
                    },
                    $push: {
                        history: {
                            $each: [{
                                quoteNumber,
                                jobTitle: notes || `Actualización de estado: ${status}`,
                                amount: Number(approvedAmount || 0),
                                currency: 'USD',
                                condoSubdomain: condoSubdomain || '',
                                sentAt: new Date(),
                                status: isApproved ? 'approved' : (isRejected ? 'rejected' : 'updated'),
                                responseCode: 200
                            }],
                            $slice: -50 // Mantener los últimos 50 eventos
                        }
                    }
                }
            );
        } catch (e) {
            console.error('[IACONDO WEBHOOK] Error actualizando estadísticas:', e.message);
        }

        // Buscar si existe un trabajo con este número de cotización en su historial o notas
        try {
            const job = await Job.findOne({
                $or: [
                    { 'projectHistory.description': { $regex: quoteNumber, $options: 'i' } },
                    { 'description': { $regex: quoteNumber, $options: 'i' } }
                ]
            });

            if (job) {
                job.projectHistory.push({
                    eventType: isApproved ? 'offer_accepted' : 'note_added',
                    actorRole: 'system',
                    timestamp: new Date(),
                    title: `IACONDO: Presupuesto ${status}`,
                    description: `El condominio ${condoSubdomain || ''} ha marcado la cotización ${quoteNumber} como ${status}. ${notes ? `Notas: ${notes}` : ''}`,
                    isPrivate: false
                });

                if (isApproved && job.status === 'active') {
                    job.status = 'in_progress';
                }

                await job.save();
                console.log(`[IACONDO WEBHOOK] Trabajo ${job._id} actualizado con el estado de IACONDO`);
            }
        } catch (err) {
            console.error('[IACONDO WEBHOOK] Error vinculando con Job:', err.message);
        }

        return {
            success: true,
            receivedAt: new Date().toISOString(),
            quoteNumber,
            status: normalizedStatus
        };
    }

    /**
     * Registra en la base de datos el resultado de sincronización
     */
    static async recordSyncResult(entry) {
        try {
            const incField = entry.status === 'success' ? { 'stats.quotesSent': 1 } : {};

            await IntegrationConfig.findOneAndUpdate(
                { provider: 'iacondo' },
                {
                    $inc: incField,
                    $set: {
                        lastSyncAt: new Date(),
                        lastSyncStatus: entry.status,
                        lastSyncMessage: entry.message
                    },
                    $push: {
                        history: {
                            $each: [{
                                quoteNumber: entry.quoteNumber,
                                jobTitle: entry.jobTitle,
                                amount: entry.amount,
                                currency: entry.currency,
                                condoSubdomain: entry.condoSubdomain,
                                sentAt: new Date(),
                                status: entry.status === 'success' ? 'sent' : 'error',
                                responseCode: entry.responseCode,
                                errorDetail: entry.errorDetail
                            }],
                            $slice: -50 // Mantener últimas 50
                        }
                    }
                },
                { upsert: true }
            );
        } catch (err) {
            console.warn('[IACONDO] Error guardando registro de sincronización:', err.message);
        }
    }
}

module.exports = IacondoIntegrationService;
