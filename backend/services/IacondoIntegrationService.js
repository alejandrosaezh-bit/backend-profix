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
            externalRequestId: String(inputData.externalRequestId || '').trim(),
            externalJobId: String(inputData.externalJobId || '').trim(),
            offerId: String(inputData.offerId || inputData.quote?.offerId || '').trim(),
            serviceCategory: (inputData.serviceCategory || 'Servicios Generales').trim(),
            jobTitle: (inputData.jobTitle || 'Mantenimiento / Reparación').trim(),
            jobDescription: (inputData.jobDescription || 'Trabajo técnico solicitado a través de Profesional Cercano').trim(),
            urgency,
            professional: {
                proId: String(inputData.professional?.proId || '').trim(),
                name: (inputData.professional?.name || 'Profesional').trim(),
                legalId: (inputData.professional?.legalId || 'Sin registrar').trim(),
                phone: (inputData.professional?.phone || '').trim(),
                email: (inputData.professional?.email || '').trim(),
                avatar: (inputData.professional?.avatar || '').trim(),
                rating: Number(inputData.professional?.rating || 5.0),
                reviewsCount: Number(inputData.professional?.reviewsCount || 0),
                isVerified: Boolean(inputData.professional?.isVerified)
            },
            quote: {
                quoteNumber: (inputData.quote?.quoteNumber || `PC-${Date.now().toString().slice(-6)}`).trim(),
                offerId: String(inputData.offerId || inputData.quote?.offerId || '').trim(),
                amount: Number(amount.toFixed(2)),
                currency,
                laborCost: Number(laborCost.toFixed(2)),
                materialsCost: Number(materialsCost.toFixed(2)),
                items: Array.isArray(inputData.quote?.items)
                    ? inputData.quote.items.map(it => ({
                        description: String(it?.description || '').trim(),
                        price: Number(it?.price || 0)
                    }))
                    : [],
                description: String(inputData.quote?.description || '').trim(),
                warranty: String(inputData.quote?.warranty || '').trim(),
                duration: String(inputData.quote?.duration || '').trim(),
                startDate: String(inputData.quote?.startDate || '').trim(),
                paymentTerms: String(inputData.quote?.paymentTerms || '').trim(),
                conditions: String(inputData.quote?.conditions || '').trim(),
                observations: String(inputData.quote?.observations || '').trim(),
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
                targetCondoUser = await User.findOne({
                    'externalIntegration.subdomain': normalizedSub,
                    clientType: 'condominio'
                });
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
            externalRequestId: overrides.externalRequestId || job.externalReference?.externalRequestId || '',
            externalJobId: String(job._id),
            offerId: offer?._id ? String(offer._id) : '',
            serviceCategory: overrides.serviceCategory || serviceCategory,
            jobTitle: overrides.jobTitle || job.title,
            jobDescription: overrides.jobDescription || job.description,
            urgency: overrides.urgency || defaultUrgency,
            professional: {
                proId: proUser._id ? String(proUser._id) : '',
                name: overrides.proName || proUser.name || 'Profesional Certificado',
                legalId: overrides.proLegalId || proUser.cedula || 'V-00000000',
                phone: overrides.proPhone || proUser.phone || '',
                email: overrides.proEmail || proUser.email || '',
                avatar: proUser.avatar || '',
                rating: overrides.proRating !== undefined ? overrides.proRating : (proUser.rating || 5.0),
                reviewsCount: Number(proUser.reviewsCount || 0),
                isVerified: Boolean(proUser.isVerified || proUser.verificationDetails?.status === 'verified')
            },
            quote: {
                quoteNumber,
                offerId: offer?._id ? String(offer._id) : '',
                amount: overrides.amount !== undefined ? overrides.amount : (offer?.amount || job.budget || 0),
                currency: overrides.currency || (offer?.currency === 'Bs' || offer?.currency === 'VES' ? 'VES' : 'USD'),
                laborCost: overrides.laborCost !== undefined ? overrides.laborCost : laborCost,
                materialsCost: overrides.materialsCost !== undefined ? overrides.materialsCost : materialsCost,
                items: Array.isArray(offer?.items) ? offer.items : [],
                description: offer?.description || offer?.descriptionLine || '',
                warranty: offer?.warranty || '',
                duration: offer?.duration || '',
                startDate: offer?.startDate || '',
                paymentTerms: offer?.paymentTerms || '',
                conditions: offer?.conditions || '',
                observations: offer?.observations || '',
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

        // 1b. Si la solicitud proviene de un Vecino particular ("Mi Hogar"), dar de alta / actualizar al vecino como Cliente Particular
        const isResidentScope =
            requestData.requestScope === 'resident' ||
            Boolean(requestData.resident && (requestData.resident.id || requestData.resident._id || requestData.resident.email));

        let residentClient = null;
        let residentAction = null;
        if (isResidentScope && requestData.resident) {
            const upsertedResident = await this.upsertResidentAsClient(requestData.resident, {
                ...condoInput,
                name: condoClient.name,
                subdomain: resolvedSubdomain,
                zone: condoClient.condoDetails?.zone || condoInput.zone,
                address: condoClient.condoDetails?.address || condoInput.address,
                city: condoClient.condoDetails?.city,
                state: condoClient.condoDetails?.state,
                coordinates: condoClient.condoDetails?.coordinates
            });
            residentClient = upsertedResident.user;
            residentAction = upsertedResident.action;
        }

        const jobOwnerClient = residentClient || condoClient;
        const unitLabel = isResidentScope
            ? String(requestData.resident?.apartmentNumber || requestData.apartmentNumber || '').trim()
            : '';

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
        const isUrgent =
            urgencyUpper === 'EMERGENCIA' ||
            Boolean(
                requestData.isEmergency === true ||
                (requestData.isUrgent === true && !['BAJA', 'NORMAL', 'ALTA'].includes(urgencyUpper))
            );

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
            [unitLabel, condoClient.name, requestData.address || condoClient.condoDetails?.address, jobLocation]
                .filter(Boolean)
                .join(' — ');
        const resolvedExactLocation = {
            address: detailedRefAddress,
            ...(incomingCoords && Number.isFinite(incomingCoords.lat) && Number.isFinite(incomingCoords.lng)
                ? { lat: incomingCoords.lat, lng: incomingCoords.lng }
                : {})
        };

        const jobTitle = (requestData.jobTitle || requestData.title || `Reparación en ${jobOwnerClient.name}`).trim();
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
        const extProviderTag = isResidentScope ? 'iacondo_resident' : 'iacondo';

        // 4. Si ya existe un Job activo vinculado a esta solicitud de IACONDO, actualizarlo sin duplicar
        let targetJob = null;
        let isUpdate = false;
        if (externalReqId) {
            targetJob = await Job.findOne({
                'externalReference.provider': { $in: ['iacondo', 'iacondo_resident'] },
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
            targetJob.client = jobOwnerClient._id;
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
                provider: extProviderTag,
                condoSubdomain: resolvedSubdomain,
                externalRequestId: externalReqId || targetJob.externalReference?.externalRequestId || '',
                syncedAt: new Date()
            };
            targetJob.projectHistory.push({
                eventType: 'note_added',
                actor: jobOwnerClient._id,
                actorRole: 'client',
                timestamp: new Date(),
                title: isResidentScope
                    ? `Solicitud actualizada por ${jobOwnerClient.name} (${condoClient.name})`
                    : `Solicitud actualizada desde IACONDO (${condoClient.name})`,
                description: `Categoría: ${categoryDoc.name} > ${resolvedSubcategory}`,
                isPrivate: false
            });
            await targetJob.save();
        } else {
            // Crear nuevo Job a nombre del Vecino Particular o del Condominio Cliente
            targetJob = await Job.create({
                client: jobOwnerClient._id,
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
                    provider: extProviderTag,
                    condoSubdomain: resolvedSubdomain,
                    externalRequestId: externalReqId,
                    syncedAt: new Date()
                },
                projectHistory: [{
                    eventType: 'job_created',
                    actor: jobOwnerClient._id,
                    actorRole: 'client',
                    timestamp: new Date(),
                    title: isResidentScope
                        ? `Solicitud de Hogar creada por ${jobOwnerClient.name} (${condoClient.name})`
                        : `Solicitud creada desde IACONDO (${condoClient.name})`,
                    description: isResidentScope
                        ? `Residente verificado de ${condoClient.name} solicita ${categoryDoc.name} > ${resolvedSubcategory}.`
                        : `El condominio ${condoClient.name} (${resolvedSubdomain}) solicita ${categoryDoc.name} > ${resolvedSubcategory}.`,
                    isPrivate: false
                }]
            });
        }

        // 5. Notificar en segundo plano a todos los usuarios con perfil profesional activo
        //    que coincidan en categoría, subcategoría, municipio/zona y urgencia (incluyendo cuentas duales).
        if (!isUpdate || targetJob.status === 'active') {
            (async () => {
                try {
                    const pros = await NotificationService.findMatchingProfessionalsForJob({
                        categoryName: categoryDoc.name,
                        subcategoryName: resolvedSubcategory,
                        location: jobLocation,
                        isUrgent,
                        excludeUserId: jobOwnerClient._id
                    });

                    console.log(
                        `[IACONDO -> PROFIX] Notificando a ${pros.length} profesionales (${categoryDoc.name} > ${resolvedSubcategory} @ ${jobLocation}) por solicitud de ${jobOwnerClient.name}`
                    );

                    for (const pro of pros) {
                        const eventTitle = isResidentScope
                            ? (isUrgent
                                ? `🚨 EMERGENCIA EN HOGAR (${condoClient.name})`
                                : `🏠 Solicitud en ${condoClient.name}: ${jobOwnerClient.name}`)
                            : (isUrgent
                                ? `🚨 EMERGENCIA CONDOMINIO: ${condoClient.name}`
                                : `🏢 Solicitud de Condominio: ${condoClient.name}`);
                        const eventBody = `${resolvedSubcategory}: ${jobTitle} — Zona: ${jobLocation}`;

                        await NotificationService.notifyUser({
                            userId: pro._id,
                            eventKey: 'prof_new_requests',
                            title: eventTitle,
                            body: eventBody,
                            data: {
                                jobId: String(targetJob._id),
                                type: isUrgent ? 'urgent_job' : 'new_job',
                                source: isResidentScope ? 'iacondo_resident' : 'iacondo'
                            },
                            buttonText: 'Ver y Cotizar',
                            buttonUrl: `profix://job/${targetJob._id}`
                        }).catch(() => {});

                        if (io) {
                            const socketPayload = {
                                jobId: targetJob._id,
                                type: isUrgent ? 'urgent_job' : 'new_job',
                                targetRole: 'pro',
                                title: eventTitle,
                                body: eventBody,
                                categoryName: categoryDoc.name,
                                subcategory: resolvedSubcategory,
                                location: jobLocation
                            };
                            io.to(`user_${pro._id}`).emit('notification', socketPayload);
                            if (isUrgent) {
                                io.to(`user_${pro._id}`).emit('urgent_job_alert', socketPayload);
                            }
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
            requestScope: isResidentScope ? 'resident' : 'condo',
            condoClient: {
                _id: condoClient._id,
                name: condoClient.name,
                subdomain: resolvedSubdomain,
                zone: condoClient.condoDetails?.zone,
                action: condoAction
            },
            ...(residentClient
                ? {
                      residentClient: {
                          _id: residentClient._id,
                          name: residentClient.name,
                          email: residentClient.email,
                          action: residentAction
                      }
                  }
                : {}),
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

        // Buscar si existe un trabajo con este número de cotización (en offers.quoteNumber, externalReference o notas)
        try {
            const orConds = [
                { 'offers.quoteNumber': quoteNumber },
                { 'projectHistory.description': { $regex: quoteNumber, $options: 'i' } },
                { 'description': { $regex: quoteNumber, $options: 'i' } }
            ];
            if (webhookData.externalRequestId) {
                orConds.unshift({ 'externalReference.externalRequestId': String(webhookData.externalRequestId) });
            }
            if (webhookData.externalJobId && require('mongoose').Types.ObjectId.isValid(webhookData.externalJobId)) {
                orConds.unshift({ _id: webhookData.externalJobId });
            }

            const job = await Job.findOne({ $or: orConds });

            if (job) {
                if (isApproved) {
                    await this.assignCondoJobOffer(
                        job._id,
                        {
                            quoteNumber,
                            offerId: webhookData.offerId,
                            proId: webhookData.proId,
                            notes
                        },
                        { bypassStrictCheck: true },
                        webhookData.io || null
                    );
                } else {
                    job.projectHistory.push({
                        eventType: 'note_added',
                        actorRole: 'system',
                        timestamp: new Date(),
                        title: `IACONDO: Presupuesto ${status}`,
                        description: `El condominio ${condoSubdomain || ''} ha marcado la cotización ${quoteNumber} como ${status}. ${notes ? `Notas: ${notes}` : ''}`,
                        isPrivate: false
                    });
                    await job.save();
                }
                console.log(`[IACONDO WEBHOOK] Trabajo ${job._id} actualizado con el estado de IACONDO (${status})`);
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
        if (subdomain) searchConditions.push({ 'externalIntegration.subdomain': subdomain, clientType: 'condominio' });
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
                    const existing = sub ? await User.findOne({ 'externalIntegration.subdomain': sub, clientType: 'condominio' }) : null;
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
     * Da de alta o actualiza automáticamente a un Vecino (Propietario / Inquilino / Residente)
     * de IACONDO como Cliente Particular verificado dentro de Profesional Cercano,
     * preservando su correo y hash bcrypt de contraseña para acceso directo unificado.
     */
    static async upsertResidentAsClient(residentData = {}, condoContext = {}) {
        if (!residentData || typeof residentData !== 'object') {
            throw new Error('Datos del residente inválidos');
        }

        const rawName = String(residentData.name || residentData.fullName || 'Vecino Verificado').trim() || 'Vecino Verificado';
        const externalId = String(residentData.id || residentData._id || residentData.externalId || '').trim();
        const rawEmailInput = String(residentData.email || '').trim().toLowerCase();
        const isSynthetic = (em) => !em || em.endsWith('@iacondo.profesionalcercano.com');
        const cleanEmail = isSynthetic(rawEmailInput) ? '' : rawEmailInput;
        const fallbackEmail = `residente.${externalId || Date.now()}@iacondo.profesionalcercano.com`;

        const cleanCedula = String(residentData.cedula || residentData.idNumber || residentData.legalId || '')
            .trim()
            .toUpperCase();
        const cleanPhone = String(residentData.phone || residentData.whatsapp || '').trim();
        const apartmentNumber = String(residentData.apartmentNumber || residentData.unit || '').trim();
        const rawPasswordHash = String(residentData.passwordHash || '').trim();
        const hasValidBcryptHash = /^\$2[aby]\$\d{2}\$/.test(rawPasswordHash);

        const condoName = String(
            residentData.condoName || condoContext.name || condoContext.condoName || ''
        ).trim();
        const condoSubdomain = this.normalizeSubdomain(
            residentData.condoSubdomain || condoContext.subdomain || condoContext.condoSubdomain || '',
            condoName
        );
        const baseAddress = String(
            residentData.address || condoContext.address || ''
        ).trim();
        const fullResidentAddress = [apartmentNumber, condoName, baseAddress]
            .filter(Boolean)
            .join(' — ');
        const zone = String(
            residentData.serviceZone || residentData.zone || condoContext.serviceZone || condoContext.zone || baseAddress || ''
        ).trim();
        const city = String(residentData.city || condoContext.city || 'Caracas').trim();
        const state = String(residentData.state || condoContext.state || 'Miranda / DC').trim();

        const rawCoords = residentData.coordinates || condoContext.coordinates || null;
        const coordinates =
            rawCoords &&
            rawCoords.lat !== undefined &&
            rawCoords.lng !== undefined &&
            Number.isFinite(Number(rawCoords.lat)) &&
            Number.isFinite(Number(rawCoords.lng))
                ? { lat: Number(rawCoords.lat), lng: Number(rawCoords.lng) }
                : undefined;

        const avatarUrl =
            residentData.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(rawName)}&background=0EA5E9&color=fff&bold=true`;

        // Buscar cuenta existente sin colisionar con cuentas corporativas de condominio
        const searchConditions = [];
        if (externalId) {
            searchConditions.push({
                'externalIntegration.provider': 'iacondo_resident',
                'externalIntegration.externalId': externalId
            });
        }
        if (cleanEmail) {
            searchConditions.push({ email: cleanEmail, clientType: { $ne: 'condominio' } });
            if (cleanEmail.endsWith('@gmail.com')) {
                const [localPart, domain] = cleanEmail.split('@');
                const dotless = `${localPart.replace(/\./g, '')}@${domain}`;
                if (dotless !== cleanEmail) {
                    searchConditions.push({ email: dotless, clientType: { $ne: 'condominio' } });
                }
            }
        }
        if (cleanCedula && cleanCedula.length >= 5) {
            searchConditions.push({ cedula: cleanCedula, clientType: { $ne: 'condominio' } });
        }

        let existingUser = null;
        if (searchConditions.length > 0) {
            existingUser = await User.findOne({ $or: searchConditions }).select('+password');
        }

        const condoDetailsPayload = {
            condoName: condoName || existingUser?.condoDetails?.condoName || '',
            address: fullResidentAddress || existingUser?.condoDetails?.address || '',
            zone: zone || existingUser?.condoDetails?.zone || '',
            city: city || existingUser?.condoDetails?.city || 'Caracas',
            state: state || existingUser?.condoDetails?.state || 'Miranda / DC',
            ...(coordinates ? { coordinates } : existingUser?.condoDetails?.coordinates ? { coordinates: existingUser.condoDetails.coordinates } : {})
        };

        const isActiveInSource = residentData.isActive !== undefined ? Boolean(residentData.isActive) : true;

        if (existingUser) {
            if (rawName && (!existingUser.name || existingUser.name === 'Vecino Verificado')) {
                existingUser.name = rawName;
            }
            if (cleanPhone && !existingUser.phone) {
                existingUser.phone = cleanPhone;
            } else if (cleanPhone && existingUser.externalIntegration?.provider === 'iacondo_resident') {
                existingUser.phone = cleanPhone;
            }
            if (cleanEmail && isSynthetic(existingUser.email)) {
                const emailConflict = await User.findOne({ email: cleanEmail, _id: { $ne: existingUser._id } });
                if (!emailConflict) {
                    existingUser.email = cleanEmail;
                }
            }
            if (cleanCedula && !existingUser.cedula) {
                const cedulaConflict = await User.findOne({ cedula: cleanCedula, _id: { $ne: existingUser._id } });
                if (!cedulaConflict) {
                    existingUser.cedula = cleanCedula;
                }
            }
            if (!existingUser.password && hasValidBcryptHash) {
                existingUser.password = rawPasswordHash;
            }
            // Preservar rol si ya es profesional o admin; asegurar 'particular' si era cliente
            if (!existingUser.clientType) {
                existingUser.clientType = 'particular';
            }
            existingUser.isActive = existingUser.role === 'professional' ? existingUser.isActive : isActiveInSource;
            if (existingUser.role === 'client') {
                existingUser.isVerified = true;
            }
            if (!existingUser.avatar) {
                existingUser.avatar = avatarUrl;
            }
            if (!existingUser.externalIntegration?.provider || existingUser.externalIntegration.provider === 'iacondo_resident') {
                existingUser.externalIntegration = {
                    provider: 'iacondo_resident',
                    externalId: externalId || existingUser.externalIntegration?.externalId || String(existingUser._id),
                    syncedAt: new Date(),
                    isActiveInSource
                };
            }
            existingUser.condoDetails = {
                ...(existingUser.condoDetails?.toObject ? existingUser.condoDetails.toObject() : (existingUser.condoDetails || {})),
                ...condoDetailsPayload
            };

            await existingUser.save();
            return { user: existingUser, action: 'updated', condoSubdomain };
        }

        let finalEmail = cleanEmail || fallbackEmail;
        const emailConflict = await User.findOne({ email: finalEmail });
        if (emailConflict) {
            finalEmail = fallbackEmail;
        }

        let finalCedula = undefined;
        if (cleanCedula && cleanCedula.length >= 5) {
            const cedulaConflict = await User.findOne({ cedula: cleanCedula });
            if (!cedulaConflict) {
                finalCedula = cleanCedula;
            }
        }

        const newUser = await User.create({
            name: rawName,
            email: finalEmail,
            ...(hasValidBcryptHash ? { password: rawPasswordHash } : {}),
            ...(finalCedula ? { cedula: finalCedula } : {}),
            role: 'client',
            clientType: 'particular',
            phone: cleanPhone,
            avatar: avatarUrl,
            isActive: isActiveInSource,
            isVerified: true,
            verificationDetails: {
                status: 'verified',
                verifiedAt: new Date()
            },
            externalIntegration: {
                provider: 'iacondo_resident',
                externalId: externalId || undefined,
                syncedAt: new Date(),
                isActiveInSource
            },
            condoDetails: condoDetailsPayload
        });

        return { user: newUser, action: 'created', condoSubdomain };
    }

    /**
     * Sincroniza en lote vecinos activos de IACONDO como Clientes Particulares en Profesional Cercano.
     */
    static async syncResidentsBatch(residentsInput = [], defaultCondoContext = {}) {
        const list = Array.isArray(residentsInput) ? residentsInput : [residentsInput];
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const errors = [];
        const syncedResidents = [];

        for (const item of list) {
            if (!item || typeof item !== 'object') {
                skippedCount++;
                continue;
            }
            try {
                const { user, action, condoSubdomain } = await this.upsertResidentAsClient(item, defaultCondoContext);
                if (action === 'created') createdCount++;
                else if (action === 'updated') updatedCount++;

                syncedResidents.push({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    clientType: user.clientType,
                    condoName: user.condoDetails?.condoName || '',
                    condoSubdomain: condoSubdomain || '',
                    zone: user.condoDetails?.zone || '',
                    action
                });
            } catch (err) {
                errors.push({
                    resident: item?.email || item?.name || 'Desconocido',
                    error: err.message
                });
            }
        }

        return {
            success: true,
            totalProcessed: list.length,
            createdCount,
            updatedCount,
            skippedCount,
            errors,
            residents: syncedResidents
        };
    }

    /**
     * Lista todos los vecinos de IACONDO dados de alta como Clientes Particulares en Profesional Cercano.
     */
    static async getSyncedResidentClients() {
        return User.find({
            'externalIntegration.provider': 'iacondo_resident'
        })
            .select('name email phone cedula avatar role isActive isVerified clientType externalIntegration condoDetails createdAt')
            .sort({ createdAt: -1 });
    }

    /**
     * Obtiene la lista de todos los Condominios dados de alta como Clientes en Profesional Cercano
     */
    static async getSyncedCondoClients() {
        const condos = await User.find({
            clientType: 'condominio'
        })
            .select('name email phone cedula avatar isActive isVerified clientType externalIntegration condoDetails createdAt')
            .sort({ createdAt: -1 });

        return condos;
    }

    /**
     * Verifica que un Job pertenezca legítimamente a un Condominio o Vecino integrado con IACONDO.
     */
    static async verifyCondoJobAccess(jobId, authParams = {}) {
        const mongoose = require('mongoose');
        if (!jobId || !mongoose.Types.ObjectId.isValid(String(jobId))) {
            const err = new Error('ID de solicitud inválido');
            err.status = 400;
            throw err;
        }

        const job = await Job.findById(jobId)
            .populate('category', 'name icon')
            .populate('client', 'name email phone avatar clientType externalIntegration condoDetails')
            .populate('offers.proId', 'name email phone cedula avatar rating reviewsCount isVerified verificationDetails profiles');

        if (!job) {
            const err = new Error('Solicitud no encontrada en Profesional Cercano');
            err.status = 404;
            throw err;
        }

        if (authParams.bypassStrictCheck) {
            return job;
        }

        const isCondoOrResidentJob =
            job.client?.clientType === 'condominio' ||
            job.externalReference?.provider === 'iacondo' ||
            job.externalReference?.provider === 'iacondo_resident' ||
            job.client?.externalIntegration?.provider === 'iacondo_resident' ||
            Boolean(job.client?.externalIntegration?.subdomain);

        if (!isCondoOrResidentJob) {
            const err = new Error('Esta solicitud no corresponde a una cuenta integrada con IACONDO');
            err.status = 403;
            throw err;
        }

        const config = await this.getConfig();
        const validApiKey = Boolean(
            authParams.apiKey &&
            (authParams.apiKey === config.apiKey || authParams.apiKey === job.client?.externalIntegration?.apiKey)
        );

        if (!validApiKey) {
            const expectedSub = this.normalizeSubdomain(
                job.externalReference?.condoSubdomain || job.client?.externalIntegration?.subdomain || ''
            );
            const providedSub = this.normalizeSubdomain(authParams.condoSubdomain || '');
            if (expectedSub && providedSub && expectedSub !== providedSub) {
                const err = new Error('El subdominio del condominio no coincide con el propietario de la solicitud');
                err.status = 403;
                throw err;
            }

            const expectedExtReq = String(job.externalReference?.externalRequestId || '').trim();
            const providedExtReq = String(authParams.externalRequestId || '').trim();
            if (expectedExtReq && (!providedExtReq || expectedExtReq !== providedExtReq)) {
                const err = new Error('Credenciales de vinculación de solicitud inválidas');
                err.status = 403;
                throw err;
            }
        }

        return job;
    }

    /**
     * FASE 2 & 3 — HUB NATIVO:
     * Devuelve el estado vivo de una solicitud de condominio en Profesional Cercano:
     * todas las ofertas comparativas con reputación y desglose + todos los hilos de chat activos.
     */
    static async getCondoJobHub(jobId, authParams = {}) {
        const Chat = require('../models/Chat');
        const job = await this.verifyCondoJobAccess(jobId, authParams);
        const condoClientIdStr = String(job.client._id);
        const catName = job.category?.name || '';

        const rawChats = await Chat.find({
            job: job._id,
            participants: job.client._id
        })
            .populate('participants', 'name email phone cedula avatar rating reviewsCount isVerified verificationDetails')
            .sort({ lastMessageDate: -1 })
            .lean();

        const chatByProId = new Map();
        const formattedChats = [];

        for (const c of rawChats) {
            const otherPro = (c.participants || []).find(p => String(p._id || p) !== condoClientIdStr);
            if (!otherPro) continue;
            const proIdStr = String(otherPro._id);
            const unreadMap = c.unreadCounts || {};
            const unreadCount = Number(unreadMap[condoClientIdStr] || 0);
            const messagesArr = Array.isArray(c.messages) ? c.messages : [];
            const lastMsgObj = messagesArr.length > 0 ? messagesArr[messagesArr.length - 1] : null;

            const matchingOffer = (job.offers || []).find(
                o => String(o.proId?._id || o.proId) === proIdStr
            );

            const chatSummary = {
                chatId: String(c._id),
                pro: {
                    _id: proIdStr,
                    name: otherPro.name || 'Profesional',
                    avatar: otherPro.avatar || '',
                    phone: otherPro.phone || '',
                    email: otherPro.email || '',
                    cedula: otherPro.cedula || '',
                    rating: Number(otherPro.rating || 5.0),
                    reviewsCount: Number(otherPro.reviewsCount || 0),
                    isVerified: Boolean(otherPro.isVerified || otherPro.verificationDetails?.status === 'verified')
                },
                lastMessage: c.lastMessage || lastMsgObj?.content || (lastMsgObj?.media ? '📷 Imagen adjunta' : ''),
                lastMessageDate: c.lastMessageDate || lastMsgObj?.createdAt || c.updatedAt,
                unreadCount,
                messagesCount: messagesArr.length,
                hasOffer: Boolean(matchingOffer),
                offerId: matchingOffer ? String(matchingOffer._id) : '',
                offerAmount: matchingOffer ? Number(matchingOffer.amount || 0) : null,
                offerCurrency: matchingOffer?.currency === 'Bs' || matchingOffer?.currency === 'VES' ? 'VES' : 'USD',
                offerStatus: matchingOffer?.status || null
            };

            chatByProId.set(proIdStr, chatSummary);
            formattedChats.push(chatSummary);
        }

        const dateCode = new Date(job.createdAt || Date.now()).getFullYear();
        const shortJobId = String(job._id).slice(-4).toUpperCase();

        const formattedOffers = (job.offers || []).map((offer, idx) => {
            const proDoc = offer.proId && typeof offer.proId === 'object' ? offer.proId : {};
            const proIdStr = String(proDoc._id || offer.proId || '');
            const profilesObj = proDoc.profiles instanceof Map
                ? Object.fromEntries(proDoc.profiles)
                : (proDoc.profiles || {});
            const catProfile = catName && profilesObj[catName] ? profilesObj[catName] : null;

            const items = Array.isArray(offer.items)
                ? offer.items.map(it => ({
                    description: String(it?.description || '').trim(),
                    price: Number(it?.price || 0)
                }))
                : [];
            const sumItems = items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
            const amount = Number(offer.amount || sumItems || 0);
            const shortOfferId = offer._id ? String(offer._id).slice(-3).toUpperCase() : String(idx + 1).padStart(3, '0');
            const quoteNumber = offer.quoteNumber || `PC-${dateCode}-${shortJobId}-${shortOfferId}`;
            const linkedChat = chatByProId.get(proIdStr) || null;

            return {
                offerId: String(offer._id),
                quoteNumber,
                proId: proIdStr,
                pro: {
                    _id: proIdStr,
                    name: proDoc.name || 'Profesional Verificado',
                    avatar: proDoc.avatar || '',
                    phone: proDoc.phone || '',
                    email: proDoc.email || '',
                    cedula: proDoc.cedula || '',
                    rating: Number(proDoc.rating || 5.0),
                    reviewsCount: Number(proDoc.reviewsCount || 0),
                    isVerified: Boolean(proDoc.isVerified || proDoc.verificationDetails?.status === 'verified'),
                    bio: catProfile?.bio || '',
                    experience: catProfile?.experience || ''
                },
                amount,
                currency: offer.currency === 'Bs' || offer.currency === 'VES' ? 'VES' : 'USD',
                laborCost: sumItems > 0 ? sumItems : amount,
                materialsCost: 0,
                items,
                description: offer.description || offer.descriptionLine || '',
                duration: offer.duration || '',
                startDate: offer.startDate || '',
                paymentTerms: offer.paymentTerms || '',
                warranty: offer.warranty || '',
                conditions: offer.conditions || '',
                observations: offer.observations || '',
                addTax: Boolean(offer.addTax),
                taxRate: Number(offer.taxRate || 0),
                status: offer.status || 'pending',
                createdAt: offer.createdAt,
                chatId: linkedChat?.chatId || null,
                unreadCount: linkedChat?.unreadCount || 0
            };
        });

        const totalUnreadMessages = formattedChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        return {
            success: true,
            job: {
                _id: String(job._id),
                title: job.title,
                description: job.description,
                status: job.status,
                trackingStatus: job.trackingStatus,
                categoryName: catName,
                subcategory: job.subcategory || '',
                location: job.location,
                exactLocation: job.exactLocation,
                isUrgent: Boolean(job.isUrgent),
                images: job.images || [],
                workPhotos: job.workPhotos || [],
                professional: job.professional ? String(job.professional) : null,
                hiredProId: job.hiredProId ? String(job.hiredProId) : (job.professional ? String(job.professional) : null),
                clientRated: Boolean(job.clientRated),
                rating: job.rating || null,
                review: job.review || '',
                createdAt: job.createdAt
            },
            condoClient: {
                _id: condoClientIdStr,
                name: job.client.name,
                subdomain: job.externalReference?.condoSubdomain || job.client?.externalIntegration?.subdomain || ''
            },
            offers: formattedOffers,
            chats: formattedChats,
            stats: {
                offersCount: formattedOffers.length,
                chatsCount: formattedChats.length,
                totalUnreadMessages
            }
        };
    }

    /**
     * FASE 3 — CHAT EMBEBIDO:
     * Obtiene o abre la conversación entre el Condominio y un Profesional específico para un Job,
     * marcando como leídos los mensajes pendientes para el condominio.
     */
    static async getOrOpenCondoJobChat(jobId, proId, authParams = {}) {
        const mongoose = require('mongoose');
        const Chat = require('../models/Chat');

        if (!proId || !mongoose.Types.ObjectId.isValid(String(proId))) {
            const err = new Error('ID de profesional inválido');
            err.status = 400;
            throw err;
        }

        const job = await this.verifyCondoJobAccess(jobId, authParams);
        const proUser = await User.findById(proId).select(
            'name email phone cedula avatar rating reviewsCount isVerified verificationDetails'
        );
        if (!proUser) {
            const err = new Error('Profesional no encontrado');
            err.status = 404;
            throw err;
        }

        let chat = await Chat.findOne({
            job: job._id,
            participants: { $all: [job.client._id, proUser._id] }
        });

        if (!chat) {
            chat = await Chat.create({
                job: job._id,
                participants: [job.client._id, proUser._id],
                messages: []
            });
            await Job.findByIdAndUpdate(job._id, { $addToSet: { conversations: chat._id } });
        } else {
            const condoIdStr = String(job.client._id);
            let dirty = false;
            if (!chat.unreadCounts) {
                chat.unreadCounts = new Map();
            }
            if ((chat.unreadCounts.get(condoIdStr) || 0) > 0) {
                chat.unreadCounts.set(condoIdStr, 0);
                chat.markModified('unreadCounts');
                dirty = true;
            }
            (chat.messages || []).forEach(m => {
                if (String(m.sender) !== condoIdStr && !m.read) {
                    m.read = true;
                    dirty = true;
                }
            });
            if (dirty) {
                await chat.save();
            }
        }

        const condoIdStr = String(job.client._id);
        const messages = (chat.messages || []).map(m => {
            const isCondoSender = String(m.sender) === condoIdStr;
            return {
                _id: String(m._id),
                senderId: String(m.sender),
                senderRole: isCondoSender ? 'condo' : 'pro',
                senderName: isCondoSender ? job.client.name : proUser.name,
                content: m.content || '',
                media: m.media || null,
                read: Boolean(m.read),
                createdAt: m.createdAt
            };
        });

        const offer = (job.offers || []).find(
            o => String(o.proId?._id || o.proId) === String(proUser._id)
        );

        return {
            success: true,
            chatId: String(chat._id),
            jobId: String(job._id),
            condoName: job.client.name,
            pro: {
                _id: String(proUser._id),
                name: proUser.name,
                avatar: proUser.avatar || '',
                phone: proUser.phone || '',
                email: proUser.email || '',
                cedula: proUser.cedula || '',
                rating: Number(proUser.rating || 5.0),
                reviewsCount: Number(proUser.reviewsCount || 0),
                isVerified: Boolean(proUser.isVerified || proUser.verificationDetails?.status === 'verified')
            },
            offer: offer
                ? {
                    offerId: String(offer._id),
                    amount: Number(offer.amount || 0),
                    currency: offer.currency === 'Bs' || offer.currency === 'VES' ? 'VES' : 'USD',
                    status: offer.status,
                    warranty: offer.warranty || '',
                    duration: offer.duration || ''
                }
                : null,
            messages
        };
    }

    /**
     * FASE 3 — CHAT EMBEBIDO (ENVÍO DE MENSAJE / FOTO / PASE QR):
     * Envía un mensaje en nombre del Condominio al Profesional, dispara Push + Email y emite Socket.io en vivo.
     */
    static async sendCondoJobChatMessage(jobId, proId, messageData = {}, authParams = {}, io = null) {
        const mongoose = require('mongoose');
        const Chat = require('../models/Chat');
        const NotificationService = require('./NotificationService');
        const { uploadImage } = require('../utils/cloudinary');

        if (!proId || !mongoose.Types.ObjectId.isValid(String(proId))) {
            const err = new Error('ID de profesional inválido');
            err.status = 400;
            throw err;
        }

        const rawContent = String(messageData.content || '').trim();
        let resolvedMedia = messageData.media || null;

        if (!rawContent && !resolvedMedia) {
            const err = new Error('El mensaje no puede estar vacío');
            err.status = 400;
            throw err;
        }

        const job = await this.verifyCondoJobAccess(jobId, authParams);
        const proUser = await User.findById(proId);
        if (!proUser) {
            const err = new Error('Profesional no encontrado');
            err.status = 404;
            throw err;
        }

        if (typeof resolvedMedia === 'string' && resolvedMedia.startsWith('data:image')) {
            const uploadedUrl = await uploadImage(resolvedMedia, 'iacondo_chats').catch(() => null);
            if (uploadedUrl) {
                resolvedMedia = uploadedUrl;
            }
        }

        let chat = await Chat.findOne({
            job: job._id,
            participants: { $all: [job.client._id, proUser._id] }
        });

        if (!chat) {
            chat = await Chat.create({
                job: job._id,
                participants: [job.client._id, proUser._id],
                messages: []
            });
            await Job.findByIdAndUpdate(job._id, { $addToSet: { conversations: chat._id } });
        }

        const newMsgPayload = {
            sender: job.client._id,
            content: rawContent,
            media: resolvedMedia || undefined,
            read: false,
            createdAt: new Date()
        };

        const updatedChat = await Chat.findByIdAndUpdate(
            chat._id,
            {
                $push: { messages: newMsgPayload },
                $set: {
                    lastMessage: rawContent || '📷 Imagen adjunta',
                    lastMessageDate: new Date()
                },
                $inc: { [`unreadCounts.${proUser._id.toString()}`]: 1 }
            },
            { new: true, select: { messages: { $slice: -1 } }, lean: true }
        );

        const createdMsg = updatedChat?.messages?.[updatedChat.messages.length - 1] || newMsgPayload;

        // Push + Socket en segundo plano para respuesta instantánea al portal de IA Condo
        (async () => {
            try {
                await NotificationService.notifyUser({
                    userId: proUser._id,
                    eventKey: 'prof_new_messages',
                    title: `💬 ${job.client.name}`,
                    body: rawContent || (
                        job.client?.clientType === 'condominio'
                            ? '📷 Te han enviado una imagen desde la administración del condominio.'
                            : `📷 ${job.client.name} te ha enviado una imagen en el chat.`
                    ),
                    data: {
                        chatId: String(chat._id),
                        jobId: String(job._id),
                        type: 'chat',
                        senderId: String(job.client._id),
                        senderName: job.client.name
                    },
                    buttonText: 'Ver y Responder',
                    buttonUrl: `profix://chat/${chat._id}`
                });

                if (io) {
                    io.to(String(chat._id)).emit('receive_message', {
                        chatId: String(chat._id),
                        message: {
                            id: createdMsg._id,
                            _id: createdMsg._id,
                            text: rawContent,
                            content: rawContent,
                            sender: 'client',
                            senderId: job.client._id,
                            createdAt: createdMsg.createdAt,
                            media: resolvedMedia
                        }
                    });

                    io.to(`user_${proUser._id}`).emit('notification', {
                        type: 'chat',
                        targetRole: 'pro',
                        chatId: String(chat._id),
                        jobId: String(job._id),
                        title: `💬 ${job.client.name}`,
                        body: rawContent || '📷 Imagen adjunta'
                    });
                }
            } catch (bgErr) {
                console.warn('[IACONDO CHAT] Aviso notificando mensaje al profesional:', bgErr.message);
            }
        })();

        return {
            success: true,
            chatId: String(chat._id),
            message: {
                _id: String(createdMsg._id || Date.now()),
                senderId: String(job.client._id),
                senderRole: 'condo',
                senderName: job.client.name,
                content: rawContent,
                media: resolvedMedia || null,
                read: false,
                createdAt: createdMsg.createdAt || new Date()
            }
        };
    }

    /**
     * FASE 2 — ADJUDICACIÓN AUTOMÁTICA DESDE IACONDO:
     * Cuando la Junta o la Votación Vecinal aprueba un presupuesto en IACONDO,
     * adjudica el Job en Profesional Cercano, notifica por Push al ganador y avisa en su chat.
     */
    static async assignCondoJobOffer(jobId, assignData = {}, authParams = {}, io = null) {
        const Chat = require('../models/Chat');
        const JobInteraction = require('../models/JobInteraction');
        const NotificationService = require('./NotificationService');
        const { GamificationService } = require('./GamificationService');

        const job = await this.verifyCondoJobAccess(jobId, authParams);

        const targetOfferId = String(assignData.offerId || '').trim();
        const targetProIdInput = String(assignData.proId || '').trim();
        const targetQuoteNum = String(assignData.quoteNumber || '').trim();

        let winningOffer = null;
        if (targetOfferId) {
            winningOffer = (job.offers || []).find(o => String(o._id) === targetOfferId);
        }
        if (!winningOffer && targetProIdInput) {
            winningOffer = (job.offers || []).find(o => String(o.proId?._id || o.proId) === targetProIdInput);
        }
        if (!winningOffer && targetQuoteNum) {
            winningOffer = (job.offers || []).find(
                o => o.quoteNumber && o.quoteNumber.toLowerCase() === targetQuoteNum.toLowerCase()
            );
        }

        const resolvedProId = winningOffer
            ? String(winningOffer.proId?._id || winningOffer.proId)
            : targetProIdInput;

        if (!resolvedProId) {
            const err = new Error('No se encontró el proveedor u oferta a adjudicar en esta solicitud');
            err.status = 400;
            throw err;
        }

        (job.offers || []).forEach(offer => {
            const oProId = String(offer.proId?._id || offer.proId);
            if (oProId === resolvedProId) {
                offer.status = 'accepted';
            } else {
                offer.status = 'rejected';
                offer.rejectionReason = 'Presupuesto adjudicado a otra propuesta por el condominio.';
            }
        });

        job.professional = resolvedProId;
        job.hiredProId = resolvedProId;
        job.status = 'in_progress';
        job.trackingStatus = 'contracted';

        job.projectHistory.push({
            eventType: 'offer_accepted',
            actor: job.client._id,
            actorRole: 'client',
            timestamp: new Date(),
            title: `Presupuesto Aprobado por ${job.client.name}`,
            description: assignData.notes
                ? `Adjudicado desde IA Condo: ${assignData.notes}`
                : `El condominio ${job.client.name} aprobó este presupuesto. Trabajo en ejecución.`,
            isPrivate: false
        });

        await job.save();

        try {
            await GamificationService.addPoints(resolvedProId, 'QUOTE_WON', job._id);
        } catch (_) {}

        await JobInteraction.findOneAndUpdate(
            { job: job._id, user: resolvedProId },
            { status: 'won', hasUnread: true, updatedAt: Date.now() },
            { upsert: true }
        ).catch(() => {});

        await JobInteraction.updateMany(
            { job: job._id, user: { $ne: resolvedProId } },
            { status: 'lost', hasUnread: true, updatedAt: Date.now() }
        ).catch(() => {});

        // Mensaje automático en el chat del profesional ganador
        try {
            let chat = await Chat.findOne({
                job: job._id,
                participants: { $all: [job.client._id, resolvedProId] }
            });
            if (!chat) {
                chat = await Chat.create({
                    job: job._id,
                    participants: [job.client._id, resolvedProId],
                    messages: []
                });
                await Job.findByIdAndUpdate(job._id, { $addToSet: { conversations: chat._id } });
            }
            const congratsMsg = `✅ ¡Hola! ${job.client.name} ha aprobado tu presupuesto para "${job.title}". Por favor coordina por esta vía la fecha de inicio e ingreso por garita.`;
            await Chat.findByIdAndUpdate(chat._id, {
                $push: {
                    messages: {
                        sender: job.client._id,
                        content: congratsMsg,
                        read: false,
                        createdAt: new Date()
                    }
                },
                $set: { lastMessage: congratsMsg, lastMessageDate: new Date() },
                $inc: { [`unreadCounts.${resolvedProId}`]: 1 }
            });
        } catch (_) {}

        // Notificación Push + Socket al ganador
        (async () => {
            try {
                await NotificationService.notifyUser({
                    userId: resolvedProId,
                    eventKey: 'prof_quote_responses',
                    title: `🎉 ¡Presupuesto Aprobado por ${job.client.name}!`,
                    body: `Tu propuesta para "${job.title}" fue adjudicada. Revisa el chat para coordinar el inicio.`,
                    data: { jobId: String(job._id), type: 'offer_accepted', source: 'iacondo' },
                    buttonText: 'Abrir Solicitud',
                    buttonUrl: `profix://job/${job._id}`
                });

                if (io) {
                    io.to(`user_${resolvedProId}`).emit('notification', {
                        type: 'offer_accepted',
                        targetRole: 'pro',
                        jobId: job._id,
                        title: `🎉 ¡Ganaste el trabajo en ${job.client.name}!`,
                        body: `Tu presupuesto para "${job.title}" ha sido aprobado.`
                    });
                    io.emit(`job_${job._id}_updated`, job);
                }
            } catch (_) {}
        })();

        return {
            success: true,
            jobId: String(job._id),
            hiredProId: resolvedProId,
            offerId: winningOffer ? String(winningOffer._id) : null,
            status: job.status
        };
    }

    /**
     * CIERRE DEL CICLO Y CALIFICACIÓN ⭐ DESDE IACONDO:
     * Marca el trabajo como culminado por el condominio y registra la valoración oficial al técnico.
     */
    static async completeAndRateCondoJob(jobId, rateData = {}, authParams = {}, io = null) {
        const Review = require('../models/Review');
        const NotificationService = require('./NotificationService');

        const job = await this.verifyCondoJobAccess(jobId, authParams);
        const proId = job.professional || job.hiredProId || rateData.proId || null;
        const numericRating = Number(rateData.rating || 0);
        const commentText = String(rateData.review || rateData.resolutionNotes || '').trim();

        job.clientFinished = true;
        job.closedAt = new Date();
        job.trackingStatus = 'finished';
        job.status = numericRating >= 1 && numericRating <= 5 ? 'rated' : 'completed';

        if (numericRating >= 1 && numericRating <= 5) {
            job.rating = numericRating;
            job.review = commentText;
            job.clientRated = true;
        }

        job.projectHistory.push({
            eventType: 'job_finished',
            actor: job.client._id,
            actorRole: 'client',
            timestamp: new Date(),
            title: `Trabajo marcado como Solucionado en ${job.client.name}`,
            description: commentText || 'Servicio culminado satisfactoriamente.',
            isPrivate: false
        });

        await job.save();

        if (proId && numericRating >= 1 && numericRating <= 5) {
            try {
                await Review.findOneAndUpdate(
                    { job: job._id, reviewer: job.client._id, reviewee: proId },
                    {
                        $set: {
                            reviewerRole: 'client',
                            rating: numericRating,
                            comment: commentText,
                            answers: {
                                deliveredOnTime: true,
                                qualityAsExpected: numericRating >= 4,
                                professionalism: numericRating >= 4
                            }
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                const allProReviews = await Review.find({ reviewee: proId, reviewerRole: 'client' }).lean();
                if (allProReviews.length > 0) {
                    const avg = allProReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / allProReviews.length;
                    await User.findByIdAndUpdate(proId, {
                        rating: Number(avg.toFixed(2)),
                        reviewsCount: allProReviews.length
                    });
                }

                await NotificationService.notifyUser({
                    userId: proId,
                    eventKey: 'prof_quote_responses',
                    title: `⭐ Nueva Calificación de ${job.client.name}`,
                    body: `Te han otorgado ${numericRating}/5 estrellas por "${job.title}".${commentText ? ` "${commentText}"` : ''}`,
                    data: { jobId: String(job._id), type: 'job_rated', source: 'iacondo' },
                    buttonText: 'Ver Mi Perfil',
                    buttonUrl: `profix://job/${job._id}`
                }).catch(() => {});

                if (io) {
                    io.to(`user_${proId}`).emit('notification', {
                        type: 'job_rated',
                        targetRole: 'pro',
                        jobId: job._id,
                        title: `⭐ ${numericRating}/5 estrellas de ${job.client.name}`,
                        body: commentText || `Trabajo "${job.title}" finalizado con éxito.`
                    });
                }
            } catch (revErr) {
                console.warn('[IACONDO RATE] Aviso guardando reseña del profesional:', revErr.message);
            }
        }

        return {
            success: true,
            jobId: String(job._id),
            status: job.status,
            rating: job.rating || null,
            clientRated: Boolean(job.clientRated)
        };
    }
}

module.exports = IacondoIntegrationService;
