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

        // Asegurar que el condominio por defecto quede dado de alta como Cliente con sus datos reales desde IACONDO
        if (configDoc.condoSubdomain) {
            try {
                await this.pullActiveCondosFromIacondo({
                    apiUrl: configDoc.apiUrl || 'https://condopro-api.onrender.com/api/integrations/v1',
                    apiKey: configDoc.apiKey || '',
                    condoSubdomain: configDoc.condoSubdomain
                });
            } catch (e) {
                console.warn('[IACONDO] No se pudo auto-sincronizar el condominio al guardar config:', e.message);
            }
        }

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

        // Formatear y asegurar contrato (resuelve el subdominio dinámico del condominio destino)
        const payload = this.formatQuotePayload(quoteData, config);

        // Validar contrato
        const validation = this.validateQuotePayload(payload);
        if (!validation.isValid) {
            const err = new Error(`Validación de cotización fallida: ${validation.errors.join('; ')}`);
            err.status = 400;
            err.errors = validation.errors;
            throw err;
        }

        // Resolución Multi-Condominio: buscar si el condominio destino tiene API Key propia o usar la global de IACONDO
        let targetCondoUser = null;
        if (payload.condoSubdomain) {
            try {
                const normalizedSub = this.normalizeSubdomain(payload.condoSubdomain);
                targetCondoUser = await User.findOne({ 'externalIntegration.subdomain': normalizedSub });
                // Si es un condominio nuevo que aún no estaba registrado como cliente, lo damos de alta automáticamente
                if (!targetCondoUser) {
                    const upserted = await this.upsertCondoAsClient({
                        subdomain: normalizedSub,
                        name: quoteData.condoName || `Condominio ${normalizedSub}`,
                        isActive: true
                    });
                    targetCondoUser = upserted.user;
                }
            } catch (e) {
                console.warn('[IACONDO] Aviso verificando condominio destino:', e.message);
            }
        }

        const effectiveApiKey = quoteData.apiKey ||
            targetCondoUser?.externalIntegration?.apiKey ||
            config.apiKey;

        if (!effectiveApiKey) {
            throw new Error('No se ha configurado la API Key de IACONDO (IACONDO_API_KEY). Por favor configúrala en el panel.');
        }

        const endpoint = `${config.apiUrl}/maintenance-quotes`;

        console.log(`[IACONDO] Enviando cotización ${payload.quote.quoteNumber} a: ${endpoint}`);
        console.log(`[IACONDO] Condominio Destino (Multi-Tenant): ${payload.condoSubdomain} | Monto: ${payload.quote.amount} ${payload.quote.currency}`);

        let response = null;
        let errorDetail = null;

        try {
            response = await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': effectiveApiKey
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
            .populate('client', 'name email phone clientType externalIntegration condoDetails');

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
        const shortOfferId = offer?._id ? offer._id.toString().slice(-3).toUpperCase() : '001';
        const quoteNumber = overrides.quoteNumber || offer?.quoteNumber || `PC-${dateCode}-${shortJobId}-${shortOfferId}`;

        // Determinar imágenes del trabajo para adjuntar en photos
        const photos = [];
        if (Array.isArray(job.images)) {
            photos.push(...job.images.filter(img => typeof img === 'string' && img.startsWith('http')));
        }
        if (Array.isArray(job.workPhotos)) {
            photos.push(...job.workPhotos.filter(img => typeof img === 'string' && img.startsWith('http')));
        }

        // Resolución Multi-Condominio: toma el subdominio del condominio dueño de la solicitud
        const dynamicSubdomain = overrides.condoSubdomain ||
            job.externalReference?.condoSubdomain ||
            job.client?.externalIntegration?.subdomain;

        const rawPayload = {
            condoSubdomain: dynamicSubdomain,
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
     * Recibe una solicitud de Reparación o Mejora desde CUALQUIER condominio en IACONDO,
     * asegura el alta automática de ese condominio como Cliente, sube fotos a Cloudinary,
     * crea o actualiza la Solicitud (Job) en Profesional Cercano y notifica a los profesionales.
     */
    static async createServiceRequestFromIacondo(requestData, io = null) {
        if (!requestData || typeof requestData !== 'object') {
            throw new Error('Datos de solicitud inválidos');
        }

        const mongoose = require('mongoose');
        const Category = require('../models/Category');
        const NotificationService = require('./NotificationService');
        const { uploadImage } = require('../utils/cloudinary');

        const rawSubdomain = requestData.condoSubdomain || requestData.subdomain || requestData.condo?.subdomain;
        const rawCondoName = requestData.condoName || requestData.condo?.name || requestData.condo?.condoName;

        if (!rawSubdomain && !rawCondoName) {
            throw new Error('Debe especificar "condoSubdomain" o los datos del condominio solicitante');
        }

        // 1. Dar de alta o actualizar automáticamente el condominio solicitante como Cliente
        const condoInput = {
            ...(requestData.condo || {}),
            subdomain: rawSubdomain,
            name: rawCondoName || requestData.condo?.name,
            zone: requestData.zone || requestData.condo?.zone || requestData.location,
            address: requestData.address || requestData.condo?.address || requestData.location,
            phone: requestData.condoPhone || requestData.condo?.phone,
            email: requestData.condoEmail || requestData.condo?.email,
            rif: requestData.condoRif || requestData.condo?.rif,
            isActive: true
        };

        const { user: condoClient, action: condoAction } = await this.upsertCondoAsClient(condoInput);
        const resolvedSubdomain = condoClient.externalIntegration?.subdomain;

        // 2. Resolver Categoría y Subcategoría exacta en Profesional Cercano
        const requestedCatId = (requestData.categoryId || '').toString().trim();
        const requestedCat = (requestData.category || requestData.categoryName || requestData.serviceCategory || 'Hogar').toString().trim();
        const requestedSubcatRaw = (requestData.subcategory || requestData.subcategoryName || requestData.serviceCategory || 'Mantenimiento General').toString().trim();

        let categoryDoc = null;
        if (requestedCatId && mongoose.Types.ObjectId.isValid(requestedCatId)) {
            categoryDoc = await Category.findById(requestedCatId);
        }

        if (!categoryDoc) {
            const escapedCat = requestedCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedSub = requestedSubcatRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            categoryDoc = await Category.findOne({
                isActive: true,
                $or: [
                    { name: { $regex: `^${escapedCat}$`, $options: 'i' } },
                    { 'subcategories.name': { $regex: `^${escapedSub}$`, $options: 'i' } },
                    { name: { $regex: escapedCat, $options: 'i' } },
                    { 'subcategories.name': { $regex: escapedSub, $options: 'i' } }
                ]
            });
        }

        if (!categoryDoc) {
            categoryDoc = await Category.findOne({ isActive: true, name: { $regex: 'Hogar', $options: 'i' } }) || await Category.findOne({ isActive: true }) || await Category.findOne();
        }

        if (!categoryDoc) {
            throw new Error('No existen categorías configuradas en Profesional Cercano');
        }

        let resolvedSubcategory = requestedSubcatRaw;
        if (Array.isArray(categoryDoc.subcategories) && categoryDoc.subcategories.length > 0) {
            const exactSub = categoryDoc.subcategories.find(
                s => s.name && s.name.toLowerCase() === requestedSubcatRaw.toLowerCase()
            );
            if (exactSub) {
                resolvedSubcategory = exactSub.name;
            } else if (!requestedSubcatRaw || requestedSubcatRaw.toLowerCase() === categoryDoc.name.toLowerCase()) {
                resolvedSubcategory = categoryDoc.subcategories[0].name;
            }
        }

        const urgencyUpper = (requestData.urgency || 'NORMAL').toString().toUpperCase();
        const isUrgent = urgencyUpper === 'EMERGENCIA' || urgencyUpper === 'ALTA' || Boolean(requestData.isUrgent);

        // Normalizar la ubicación principal a "Municipio, Región" para que coincida con las zonas de cobertura de los profesionales
        const PROFIX_ZONES_MAP = {
            'Gran Caracas': ['Libertador', 'Chacao', 'Baruta', 'Sucre', 'El Hatillo'],
            'La Guaira': ['Vargas'],
            'Altos Mirandinos': ['Los Salias', 'Carrizal', 'Guaicaipuro'],
            'Guarenas-Guatire': ['Plaza', 'Zamora'],
            'Valencia': ['Valencia', 'Naguanagua', 'San Diego', 'Los Guayos', 'Libertador (Carabobo)'],
            'Maracay': ['Girardot', 'Mario Briceño Iragorry', 'Santiago Mariño'],
            'Barquisimeto': ['Iribarren', 'Palavecino'],
            'Maracaibo': ['Maracaibo', 'San Francisco'],
            'Puerto La Cruz': ['Sotillo', 'Simón Bolívar', 'Urbaneja', 'Guanta'],
            'San Cristóbal': ['San Cristóbal', 'Cárdenas'],
            'Margarita': ['Mariño', 'Maneiro', 'Arismendi', 'García'],
            'Puerto Ordaz': ['Caroní']
        };
        const stripAcc = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const resolveStandardZone = (...candidates) => {
            for (const cand of candidates) {
                const text = stripAcc(cand);
                if (!text) continue;
                for (const [region, munis] of Object.entries(PROFIX_ZONES_MAP)) {
                    for (const muni of munis) {
                        const full = `${muni}, ${region}`;
                        if (stripAcc(full) === text) return full;
                    }
                }
                for (const [region, munis] of Object.entries(PROFIX_ZONES_MAP)) {
                    for (const muni of munis) {
                        const cleanMuni = stripAcc(muni.replace(/\s*\(.*?\)\s*/g, ''));
                        if (cleanMuni.length >= 4 && text.includes(cleanMuni)) {
                            return `${muni}, ${region}`;
                        }
                    }
                }
            }
            return '';
        };

        const standardizedZone = resolveStandardZone(
            requestData.zone,
            requestData.condo?.serviceZone,
            requestData.condo?.zone,
            requestData.location,
            condoClient.condoDetails?.zone,
            requestData.address,
            condoClient.condoDetails?.address
        );

        const jobLocation = standardizedZone ||
            requestData.location ||
            condoClient.condoDetails?.zone ||
            condoClient.condoDetails?.address ||
            condoClient.name;

        const incomingCoords = (
            requestData.exactLocation?.lat !== undefined && requestData.exactLocation?.lng !== undefined
                ? { lat: Number(requestData.exactLocation.lat), lng: Number(requestData.exactLocation.lng) }
                : (condoClient.condoDetails?.coordinates?.lat !== undefined
                    ? { lat: Number(condoClient.condoDetails.coordinates.lat), lng: Number(condoClient.condoDetails.coordinates.lng) }
                    : null)
        );
        const detailedRefAddress = requestData.exactLocation?.address ||
            [condoClient.name, requestData.address || condoClient.condoDetails?.address, jobLocation]
                .filter(Boolean)
                .join(' — ');
        const resolvedExactLocation = {
            address: detailedRefAddress,
            ...(incomingCoords && Number.isFinite(incomingCoords.lat) && Number.isFinite(incomingCoords.lng)
                ? { lat: incomingCoords.lat, lng: incomingCoords.lng }
                : {})
        };

        const jobTitle = (requestData.jobTitle || requestData.title || `Reparación en ${condoClient.name}`).trim();
        const jobDescription = (requestData.jobDescription || requestData.description || jobTitle).trim();

        // 3. Procesar y subir fotos sincronizadas a Cloudinary (acepta URLs https:// y data:image base64)
        const rawImages = Array.isArray(requestData.images || requestData.photos)
            ? (requestData.images || requestData.photos)
            : [];
        const uploadedImages = [];

        for (const img of rawImages.slice(0, 6)) {
            if (!img || typeof img !== 'string') continue;
            if (img.startsWith('data:image')) {
                const cloudUrl = await uploadImage(img, 'iacondo_jobs');
                if (cloudUrl) {
                    uploadedImages.push(cloudUrl);
                } else {
                    uploadedImages.push(img);
                }
            } else if (img.startsWith('http://') || img.startsWith('https://')) {
                uploadedImages.push(img);
            }
        }

        const externalReqId = (requestData.externalRequestId || requestData.requestId || requestData.id || '').toString().trim();

        // 4. Si ya existe un Job activo vinculado a esta solicitud de IACONDO, actualizarlo sin duplicar
        let targetJob = null;
        let isUpdate = false;
        if (externalReqId) {
            targetJob = await Job.findOne({
                'externalReference.provider': 'iacondo',
                'externalReference.condoSubdomain': resolvedSubdomain,
                'externalReference.externalRequestId': externalReqId,
                status: { $nin: ['canceled', 'archived'] }
            });
        }
        if (!targetJob && requestData.externalJobId && mongoose.Types.ObjectId.isValid(requestData.externalJobId)) {
            targetJob = await Job.findById(requestData.externalJobId);
        }

        if (targetJob) {
            isUpdate = true;
            targetJob.title = jobTitle;
            targetJob.description = jobDescription;
            targetJob.category = categoryDoc._id;
            targetJob.subcategory = resolvedSubcategory;
            targetJob.location = jobLocation;
            targetJob.exactLocation = resolvedExactLocation;
            targetJob.isUrgent = isUrgent;
            if (requestData.budget !== undefined && requestData.budget !== '') {
                targetJob.budget = Number(requestData.budget);
            }
            if (uploadedImages.length > 0 || Array.isArray(requestData.images)) {
                targetJob.images = uploadedImages;
            }
            targetJob.externalReference = {
                provider: 'iacondo',
                condoSubdomain: resolvedSubdomain,
                externalRequestId: externalReqId || targetJob.externalReference?.externalRequestId || '',
                syncedAt: new Date()
            };
            targetJob.projectHistory.push({
                eventType: 'note_added',
                actor: condoClient._id,
                actorRole: 'client',
                timestamp: new Date(),
                title: `Solicitud actualizada desde IACONDO (${condoClient.name})`,
                description: `Categoría: ${categoryDoc.name} > ${resolvedSubcategory}`,
                isPrivate: false
            });
            await targetJob.save();
        } else {
            // Crear nuevo Job a nombre del Condominio Cliente
            targetJob = await Job.create({
                client: condoClient._id,
                title: jobTitle,
                description: jobDescription,
                category: categoryDoc._id,
                subcategory: resolvedSubcategory,
                location: jobLocation,
                isUrgent,
                exactLocation: resolvedExactLocation,
                budget: requestData.budget ? Number(requestData.budget) : undefined,
                images: uploadedImages,
                externalReference: {
                    provider: 'iacondo',
                    condoSubdomain: resolvedSubdomain,
                    externalRequestId: externalReqId,
                    syncedAt: new Date()
                },
                projectHistory: [{
                    eventType: 'job_created',
                    actor: condoClient._id,
                    actorRole: 'client',
                    timestamp: new Date(),
                    title: `Solicitud creada desde IACONDO (${condoClient.name})`,
                    description: `El condominio ${condoClient.name} (${resolvedSubdomain}) solicita ${categoryDoc.name} > ${resolvedSubcategory}.`,
                    isPrivate: false
                }]
            });

            // 5. Notificar en segundo plano a todos los profesionales activos de esta categoría
            (async () => {
                try {
                    const proQuery = {
                        [`profiles.${categoryDoc.name}`]: { $exists: true },
                        role: 'professional',
                        isActive: true
                    };
                    if (isUrgent) {
                        proQuery[`profiles.${categoryDoc.name}.acceptsUrgentJobs`] = true;
                    }
                    const pros = await User.find(proQuery).select('_id name');
                    console.log(`[IACONDO -> PROFIX] Notificando a ${pros.length} profesionales de "${categoryDoc.name}" por solicitud de ${condoClient.name}`);

                    for (const pro of pros) {
                        const eventTitle = isUrgent
                            ? `🚨 EMERGENCIA CONDOMINIO: ${condoClient.name}`
                            : `🏢 Solicitud de Condominio: ${condoClient.name}`;
                        const eventBody = `${resolvedSubcategory}: ${jobTitle} — Zona: ${jobLocation}`;

                        await NotificationService.notifyUser({
                            userId: pro._id,
                            eventKey: 'prof_new_requests',
                            title: eventTitle,
                            body: eventBody,
                            data: { jobId: targetJob._id, type: isUrgent ? 'urgent_job' : 'new_job', source: 'iacondo' },
                            buttonText: 'Ver y Cotizar',
                            buttonUrl: `profix://job/${targetJob._id}`
                        }).catch(() => {});

                        if (io) {
                            io.to(`user_${pro._id}`).emit(isUrgent ? 'urgent_job_alert' : 'notification', {
                                jobId: targetJob._id,
                                type: isUrgent ? 'urgent_job' : 'new_job',
                                title: eventTitle,
                                body: eventBody,
                                categoryName: categoryDoc.name,
                                subcategory: resolvedSubcategory,
                                location: jobLocation
                            });
                        }
                    }
                } catch (notifyErr) {
                    console.warn('[IACONDO -> PROFIX] Aviso enviando notificaciones a profesionales:', notifyErr.message);
                }
            })();
        }

        return {
            success: true,
            isUpdate,
            condoClient: {
                _id: condoClient._id,
                name: condoClient.name,
                subdomain: resolvedSubdomain,
                zone: condoClient.condoDetails?.zone,
                action: condoAction
            },
            category: {
                _id: categoryDoc._id,
                name: categoryDoc.name,
                subcategory: resolvedSubcategory
            },
            uploadedImages,
            job: targetJob
        };
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

    /**
     * Normaliza un subdominio o genera uno limpio a partir del nombre del condominio
     */
    static normalizeSubdomain(rawSubdomain, fallbackName = '') {
        const source = (rawSubdomain || fallbackName || '').toString().trim().toLowerCase();
        return source
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Da de alta o actualiza automáticamente un Condominio de IACONDO
     * como Cliente verificado dentro de Profesional Cercano.
     */
    static async upsertCondoAsClient(condoData) {
        if (!condoData || typeof condoData !== 'object') {
            throw new Error('Datos del condominio inválidos');
        }

        const rawName = condoData.name || condoData.condoName || condoData.nombre || condoData.razonSocial || '';
        const subdomain = this.normalizeSubdomain(
            condoData.subdomain || condoData.condoSubdomain || condoData.slug,
            rawName
        );

        if (!subdomain && !rawName) {
            throw new Error('El condominio debe incluir al menos "subdomain" o "name"');
        }

        const displayCondoName = rawName
            ? (rawName.toLowerCase().includes('condominio') || rawName.toLowerCase().includes('residencia') || rawName.toLowerCase().includes('conjunto')
                ? rawName.trim()
                : `Condominio ${rawName.trim()}`)
            : `Condominio ${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)}`;

        const externalId = (condoData.id || condoData._id || condoData.externalId || subdomain).toString();
        const sup = condoData.supportAgentSettings || {};

        const rif = (
            condoData.rif ||
            condoData.legalId ||
            condoData.adminRif ||
            condoData.taxId ||
            condoData.cedula ||
            ''
        ).toString().trim().toUpperCase();

        const candidateEmail = (
            condoData.contactEmail ||
            condoData.email ||
            condoData.adminEmail ||
            condoData.emailSettings?.user ||
            sup.boardMemberEmail ||
            condoData.correo ||
            ''
        ).toString().trim().toLowerCase();

        const isSyntheticEmail = (em) => !em || em.endsWith('@iacondo.profesionalcercano.com');
        const rawEmail = isSyntheticEmail(candidateEmail) ? '' : candidateEmail;
        const fallbackEmail = `condo.${subdomain || Date.now()}@iacondo.profesionalcercano.com`;
        const emailToUse = rawEmail || fallbackEmail;

        const phone = (
            condoData.contactPhone ||
            condoData.phone ||
            condoData.adminPhone ||
            sup.boardMemberWhatsapp ||
            condoData.garitaPhone ||
            condoData.telefono ||
            ''
        ).toString().trim();

        const address = (condoData.address || condoData.direccion || condoData.location || '').toString().trim();
        const zone = (condoData.zone || condoData.zona || condoData.urbanizacion || condoData.sector || address || '').toString().trim();
        const city = (condoData.city || condoData.ciudad || 'Caracas').toString().trim();
        const state = (condoData.state || condoData.estado || 'Miranda / DC').toString().trim();
        const adminName = (
            condoData.adminName ||
            sup.boardMemberName ||
            condoData.contactName ||
            condoData.administrador ||
            'Junta de Condominio'
        ).toString().trim();
        const unitsCount = Number(condoData.unitsCount || condoData.totalUnits || condoData.unidades || 0);

        let isActiveInSource = true;
        if (condoData.isActive !== undefined) {
            isActiveInSource = Boolean(condoData.isActive);
        } else if (condoData.active !== undefined) {
            isActiveInSource = Boolean(condoData.active);
        } else if (typeof condoData.status === 'string') {
            const st = condoData.status.toUpperCase();
            isActiveInSource = st === 'ACTIVE' || st === 'ACTIVO' || st === 'ENABLED';
        }

        let coordinates = undefined;
        if (condoData.coordinates && condoData.coordinates.lat !== undefined && condoData.coordinates.lng !== undefined) {
            coordinates = {
                lat: Number(condoData.coordinates.lat),
                lng: Number(condoData.coordinates.lng)
            };
        } else if (condoData.lat !== undefined && condoData.lng !== undefined) {
            coordinates = {
                lat: Number(condoData.lat),
                lng: Number(condoData.lng)
            };
        }

        const avatarUrl = condoData.logoUrl || condoData.logo || condoData.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayCondoName)}&background=0284C7&color=fff&bold=true`;

        // 1. Buscar si el condominio ya existe en Profesional Cercano
        const searchConditions = [];
        if (subdomain) searchConditions.push({ 'externalIntegration.subdomain': subdomain });
        if (externalId) searchConditions.push({ 'externalIntegration.externalId': externalId, 'externalIntegration.provider': 'iacondo' });
        if (rawEmail) searchConditions.push({ email: rawEmail, clientType: 'condominio' });

        let existingUser = null;
        if (searchConditions.length > 0) {
            existingUser = await User.findOne({ $or: searchConditions });
        }

        const resolvedRif = rif || existingUser?.condoDetails?.rif || existingUser?.cedula || '';
        const resolvedAdminEmail = rawEmail || existingUser?.condoDetails?.adminEmail || (!isSyntheticEmail(existingUser?.email) ? existingUser?.email : '') || '';
        const resolvedPhone = phone || existingUser?.phone || existingUser?.condoDetails?.adminPhone || '';

        const resolvedCoordinates = coordinates || (
            existingUser?.condoDetails?.coordinates &&
            existingUser.condoDetails.coordinates.lat !== undefined &&
            existingUser.condoDetails.coordinates.lng !== undefined
                ? {
                    lat: existingUser.condoDetails.coordinates.lat,
                    lng: existingUser.condoDetails.coordinates.lng
                }
                : null
        );

        const condoDetailsPayload = {
            condoName: displayCondoName,
            rif: resolvedRif,
            address: address || existingUser?.condoDetails?.address || '',
            zone: zone || existingUser?.condoDetails?.zone || address || '',
            city: city || existingUser?.condoDetails?.city || 'Caracas',
            state: state || existingUser?.condoDetails?.state || 'Miranda / DC',
            adminName: (adminName && adminName !== 'Junta de Condominio') ? adminName : (existingUser?.condoDetails?.adminName || adminName || 'Junta de Condominio'),
            adminEmail: resolvedAdminEmail,
            adminPhone: resolvedPhone,
            unitsCount: unitsCount || existingUser?.condoDetails?.unitsCount || 0
        };

        if (resolvedCoordinates) {
            condoDetailsPayload.coordinates = resolvedCoordinates;
        }

        const externalIntegrationPayload = {
            provider: 'iacondo',
            externalId,
            subdomain,
            apiKey: condoData.apiKey || existingUser?.externalIntegration?.apiKey || undefined,
            syncedAt: new Date(),
            isActiveInSource
        };

        if (existingUser) {
            if (rawName || !existingUser.name) {
                existingUser.name = displayCondoName;
            }
            if (resolvedPhone) {
                existingUser.phone = resolvedPhone;
            }
            // Actualizar correo si llegó un correo real del condominio y no choca con otro usuario
            if (rawEmail && existingUser.email !== rawEmail) {
                const emailTaken = await User.findOne({ email: rawEmail, _id: { $ne: existingUser._id } });
                if (!emailTaken) {
                    existingUser.email = rawEmail;
                }
            }
            existingUser.clientType = 'condominio';
            existingUser.isActive = isActiveInSource;
            existingUser.isVerified = true;
            if (!existingUser.avatar || existingUser.avatar.includes('ui-avatars.com')) {
                existingUser.avatar = avatarUrl;
            }
            existingUser.externalIntegration = externalIntegrationPayload;
            existingUser.condoDetails = condoDetailsPayload;

            // Guardar el RIF del condominio en el campo cedula (identificación legal) si no choca con otro usuario
            if (resolvedRif && existingUser.cedula !== resolvedRif) {
                const cedulaTaken = await User.findOne({ cedula: resolvedRif, _id: { $ne: existingUser._id } });
                if (!cedulaTaken) {
                    existingUser.cedula = resolvedRif;
                }
            }

            await existingUser.save();
            return { user: existingUser, action: 'updated' };
        } else {
            // Verificar que el email no esté ocupado por otro usuario distinto
            let finalEmail = emailToUse;
            const emailConflict = await User.findOne({ email: finalEmail });
            if (emailConflict) {
                finalEmail = fallbackEmail;
            }

            // Verificar que el RIF no choque con cedula existente
            let finalCedula = undefined;
            if (resolvedRif) {
                const cedulaConflict = await User.findOne({ cedula: resolvedRif });
                if (!cedulaConflict) {
                    finalCedula = resolvedRif;
                }
            }

            const newUser = await User.create({
                name: displayCondoName,
                email: finalEmail,
                cedula: finalCedula,
                role: 'client',
                clientType: 'condominio',
                phone: resolvedPhone || '',
                avatar: avatarUrl,
                isActive: isActiveInSource,
                isVerified: true,
                verificationDetails: {
                    status: 'verified',
                    verifiedAt: new Date()
                },
                externalIntegration: externalIntegrationPayload,
                condoDetails: condoDetailsPayload
            });

            return { user: newUser, action: 'created' };
        }
    }

    /**
     * Procesa un lote de condominios activos y los da de alta/actualiza como Clientes
     */
    static async syncCondosBatch(condosInput = []) {
        const condosArray = Array.isArray(condosInput) ? condosInput : [condosInput];

        // Filtrar solo condominios activos si viene el campo explícito en falso y se requiere solo activos
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const errors = [];
        const syncedCondos = [];

        for (const item of condosArray) {
            try {
                // Si el condominio viene marcado explícitamente como inactivo en un alta inicial, igual podemos sincronizar su estado o dar de alta los activos
                const isExplicitlyInactive = item.isActive === false || item.active === false ||
                    (typeof item.status === 'string' && ['INACTIVE', 'INACTIVO', 'SUSPENDED', 'DELETED'].includes(item.status.toUpperCase()));

                if (isExplicitlyInactive && item.skipInactive !== false) {
                    // Si ya existía en Profesional Cercano, actualizamos su estado a inactivo
                    const sub = this.normalizeSubdomain(item.subdomain || item.condoSubdomain, item.name);
                    const existing = sub ? await User.findOne({ 'externalIntegration.subdomain': sub }) : null;
                    if (existing) {
                        existing.isActive = false;
                        existing.externalIntegration.isActiveInSource = false;
                        existing.externalIntegration.syncedAt = new Date();
                        await existing.save();
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                    continue;
                }

                const { user, action } = await this.upsertCondoAsClient(item);
                if (action === 'created') createdCount++;
                if (action === 'updated') updatedCount++;

                syncedCondos.push({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    subdomain: user.externalIntegration?.subdomain,
                    zone: user.condoDetails?.zone,
                    address: user.condoDetails?.address,
                    rif: user.condoDetails?.rif || user.cedula,
                    unitsCount: user.condoDetails?.unitsCount,
                    isActive: user.isActive,
                    action
                });
            } catch (err) {
                errors.push({
                    condo: item?.subdomain || item?.name || 'Desconocido',
                    error: err.message
                });
            }
        }

        // Contar total de condominios clientes activos en la BD
        const totalCondosInDb = await User.countDocuments({ clientType: 'condominio', isActive: true });

        await IntegrationConfig.findOneAndUpdate(
            { provider: 'iacondo' },
            {
                $set: {
                    'stats.condosSynced': totalCondosInDb,
                    lastCondoSyncAt: new Date(),
                    lastSyncAt: new Date(),
                    lastSyncStatus: errors.length === 0 ? 'success' : 'error',
                    lastSyncMessage: `Sincronización de condominios: ${createdCount} nuevos, ${updatedCount} actualizados (${totalCondosInDb} activos en total)`
                }
            },
            { upsert: true }
        );

        return {
            success: true,
            totalProcessed: condosArray.length,
            createdCount,
            updatedCount,
            skippedCount,
            totalActiveCondosInDb: totalCondosInDb,
            errors,
            condos: syncedCondos
        };
    }

    /**
     * Consulta la API de IACONDO para traer todos los condominios activos
     * y darlos de alta automáticamente como Clientes en Profesional Cercano.
     */
    static async pullActiveCondosFromIacondo(customConfig = null) {
        const config = customConfig || await this.getConfig();

        if (!config.apiUrl) {
            throw new Error('No se ha configurado IACONDO_API_URL');
        }

        const baseHost = config.apiUrl.replace(/\/api\/integrations\/v1\/?$/i, '').replace(/\/+$/, '');

        const candidateEndpoints = [
            `${config.apiUrl}/condos?status=active`,
            `${config.apiUrl}/active-condos`,
            `${config.apiUrl}/condominiums?active=true`
        ];

        let fetchedCondos = null;
        let usedEndpoint = null;
        let lastError = null;

        if (config.apiKey) {
            for (const endpoint of candidateEndpoints) {
                try {
                    console.log(`[IACONDO] Consultando condominios activos en: ${endpoint}`);
                    const response = await axios.get(endpoint, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': config.apiKey
                        },
                        timeout: 12000
                    });

                    const body = response.data;
                    if (Array.isArray(body)) {
                        fetchedCondos = body;
                    } else if (Array.isArray(body?.condos)) {
                        fetchedCondos = body.condos;
                    } else if (Array.isArray(body?.condominiums)) {
                        fetchedCondos = body.condominiums;
                    } else if (Array.isArray(body?.data)) {
                        fetchedCondos = body.data;
                    } else if (body && typeof body === 'object' && (body.subdomain || body.name)) {
                        fetchedCondos = [body];
                    }

                    if (fetchedCondos && fetchedCondos.length > 0) {
                        usedEndpoint = endpoint;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                }
            }
        }

        // Respaldo: consultar lista pública e información detallada por subdominio desde IACONDO
        if (!fetchedCondos || fetchedCondos.length === 0) {
            try {
                const publicListEndpoint = `${baseHost}/api/condo/public-list`;
                const listResp = await axios.get(publicListEndpoint, { timeout: 10000 });
                if (Array.isArray(listResp.data) && listResp.data.length > 0) {
                    const detailedCondos = [];
                    for (const item of listResp.data) {
                        const sub = item.subdomain;
                        if (sub) {
                            try {
                                const infoResp = await axios.get(`${baseHost}/api/condo/info/${sub}`, { timeout: 8000 });
                                if (infoResp.data && typeof infoResp.data === 'object') {
                                    detailedCondos.push({ ...item, ...infoResp.data, isActive: true });
                                    continue;
                                }
                            } catch (e) {
                                // ignore info error and push basic item
                            }
                        }
                        detailedCondos.push({ ...item, isActive: true });
                    }
                    fetchedCondos = detailedCondos;
                    usedEndpoint = publicListEndpoint;
                }
            } catch (err) {
                lastError = lastError || err;
            }
        }

        // Respaldo adicional: consultar directamente /api/condo/info/:subdomain para el subdominio configurado
        if ((!fetchedCondos || fetchedCondos.length === 0) && config.condoSubdomain) {
            try {
                const infoEndpoint = `${baseHost}/api/condo/info/${config.condoSubdomain}`;
                const infoResp = await axios.get(infoEndpoint, { timeout: 10000 });
                if (infoResp.data && typeof infoResp.data === 'object') {
                    fetchedCondos = [{ ...infoResp.data, subdomain: config.condoSubdomain, isActive: true }];
                    usedEndpoint = infoEndpoint;
                }
            } catch (err) {
                lastError = lastError || err;
            }
        }

        // Si la API remota aún no expone el GET o no devolvió lista, aseguramos al menos el condominio configurado en CONDO_SUBDOMAIN
        if (!fetchedCondos || fetchedCondos.length === 0) {
            if (config.condoSubdomain) {
                const defaultCondoResult = await this.syncCondosBatch([
                    {
                        subdomain: config.condoSubdomain,
                        name: `Condominio ${config.condoSubdomain.charAt(0).toUpperCase() + config.condoSubdomain.slice(1)}`,
                        isActive: true
                    }
                ]);

                return {
                    ...defaultCondoResult,
                    source: 'config_subdomain_fallback',
                    message: lastError
                        ? `Se aseguró el alta del condominio configurado (${config.condoSubdomain}). Nota API remota: ${lastError.response?.status || lastError.message}`
                        : `Condominio configurado (${config.condoSubdomain}) dado de alta como cliente activo.`
                };
            }

            throw new Error(
                lastError
                    ? `No se pudo obtener el listado remoto desde IACONDO (${lastError.response?.status || lastError.message})`
                    : 'IACONDO no devolvió condominios activos'
            );
        }

        const batchResult = await this.syncCondosBatch(fetchedCondos);
        return {
            ...batchResult,
            source: usedEndpoint,
            message: `Se sincronizaron ${batchResult.totalProcessed} condominios activos desde IACONDO (${batchResult.createdCount} nuevos, ${batchResult.updatedCount} actualizados).`
        };
    }

    /**
     * Obtiene la lista de todos los Condominios dados de alta como Clientes en Profesional Cercano
     */
    static async getSyncedCondoClients() {
        const condos = await User.find({
            $or: [
                { clientType: 'condominio' },
                { 'externalIntegration.provider': 'iacondo' }
            ]
        })
            .select('name email phone cedula avatar isActive isVerified clientType externalIntegration condoDetails createdAt')
            .sort({ createdAt: -1 });

        return condos;
    }
}

module.exports = IacondoIntegrationService;
