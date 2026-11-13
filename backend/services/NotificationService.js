const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const https = require('https');

class NotificationService {
    /**
     * Send Push Notification via Expo Push API (UTF-8 safe)
     */
    static async sendPushNotification(pushToken, title, body, data = {}) {
        if (!pushToken || typeof pushToken !== 'string') return null;

        const payloadData = {
            ...data,
            type: data?.type || 'job_update'
        };

        const message = {
            to: pushToken,
            sound: 'default',
            priority: 'high',
            channelId: 'default',
            title: String(title || ''),
            body: String(body || ''),
            data: payloadData,
        };

        const bodyBuffer = Buffer.from(JSON.stringify([message]), 'utf8');

        const options = {
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'Content-Length': bodyBuffer.length,
            },
        };

        return new Promise((resolve) => {
            try {
                const req = https.request(options, (res) => {
                    let rawResponse = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        rawResponse += chunk;
                    });
                    res.on('end', () => {
                        try {
                            const parsed = rawResponse ? JSON.parse(rawResponse) : null;
                            const ticket = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data;
                            if (res.statusCode >= 400 || ticket?.status === 'error') {
                                console.warn(`[NotificationService] Expo Push warning (${res.statusCode}) for ${pushToken}:`, rawResponse);
                            } else {
                                console.log(`[NotificationService] Push sent (${res.statusCode}) to ${pushToken} -> ticket: ${ticket?.id || 'ok'}`);
                            }
                            resolve(parsed);
                        } catch (_) {
                            resolve({ raw: rawResponse, statusCode: res.statusCode });
                        }
                    });
                });
                req.on('error', (e) => {
                    console.error('[NotificationService] Error sending push notification:', e.message);
                    resolve(null);
                });
                req.write(bodyBuffer);
                req.end();
            } catch (e) {
                console.error('[NotificationService] Exception sending push:', e.message);
                resolve(null);
            }
        });
    }

    /**
     * Encuentra todos los usuarios con perfil profesional activo que coincidan con
     * la categoría, subcategoría, municipio/zona y urgencia de una solicitud,
     * sin excluir cuentas duales cuyo `role` base sea `'client'`.
     */
    static async findMatchingProfessionalsForJob({
        categoryName,
        subcategoryName = '',
        location = '',
        isUrgent = false,
        excludeUserId = null
    }) {
        if (!categoryName) return [];

        const stripAccents = (val) =>
            String(val || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();

        const targetCatNorm = stripAccents(categoryName);
        const targetSubNorm = stripAccents(subcategoryName);
        const targetLocNorm = stripAccents(location);

        const baseQuery = {
            profiles: { $exists: true },
            isActive: { $ne: false },
            clientType: { $ne: 'condominio' }
        };
        if (excludeUserId) {
            baseQuery._id = { $ne: excludeUserId };
        }

        const candidates = await User.find(baseQuery)
            .select('_id name email role pushToken profiles notificationPreferences')
            .lean();

        return candidates.filter((user) => {
            const profilesObj = user.profiles instanceof Map
                ? Object.fromEntries(user.profiles)
                : (user.profiles || {});

            const matchingKeys = Object.keys(profilesObj).filter((key) => {
                const prof = profilesObj[key];
                return prof && prof.isActive !== false && stripAccents(key) === targetCatNorm;
            });

            if (matchingKeys.length === 0) return false;

            return matchingKeys.some((key) => {
                const profile = profilesObj[key];

                if (isUrgent && profile.acceptsUrgentJobs !== true) {
                    return false;
                }

                const profileSubs = Array.isArray(profile.subcategories) ? profile.subcategories : [];
                if (profileSubs.length > 0 && targetSubNorm) {
                    const hasSub = profileSubs.some((s) => stripAccents(s) === targetSubNorm);
                    if (!hasSub) return false;
                }

                const profileZones = Array.isArray(profile.zones) ? profile.zones : [];
                if (profileZones.length > 0 && targetLocNorm) {
                    const hasZone = profileZones.some((z) => {
                        const zNorm = stripAccents(z);
                        if (!zNorm) return false;
                        if (zNorm === targetLocNorm) return true;
                        const muniPart = zNorm.split(',')[0].replace(/\s*\(.*?\)\s*/g, '').trim();
                        return muniPart.length >= 4 && targetLocNorm.includes(muniPart);
                    });
                    if (!hasZone) return false;
                }

                return true;
            });
        });
    }

    /**
     * Build standard HTML Email Template
     */
    static buildHtmlEmail(title, message, buttonText, buttonUrl, color = '#EA580C') {
        return `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: ${color}; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Profesional Cercano</h1>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${title}</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    ${message}
                </p>
                ${buttonText && buttonUrl ? `
                <div style="text-align: center; margin-top: 40px;">
                    <a href="${buttonUrl}" style="background-color: ${color}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                        ${buttonText}
                    </a>
                </div>
                ` : ''}
            </div>
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Profesional Cercano. Todos los derechos reservados.
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin-top: 10px;">
                    Puedes cambiar tus preferencias de notificación en la sección Perfil de la aplicación.
                </p>
            </div>
        </div>
        `;
    }

    /**
     * Unified Notification Sender
     * @param {Object} params - The parameters
     * @param {string} params.userId - Target user ID
     * @param {string} params.eventKey - Key from notificationPreferences (e.g., 'client_new_quotes')
     * @param {string} params.title - Notification Title
     * @param {string} params.body - Notification Body (Push & Email)
     * @param {Object} params.data - Push Data Payload (e.g., { jobId: '123' })
     * @param {string} params.buttonText - Call to action text for Email
     * @param {string} params.buttonUrl - Deep link URL for Email (e.g., 'profix://job/123')
     */
    static async notifyUser({ userId, eventKey, title, body, data = {}, buttonText, buttonUrl }) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            // Determine if preferences allow push/email. Defaults to true if structure is missing.
            let prefs = { push: true, email: true };
            if (user.notificationPreferences && user.notificationPreferences[eventKey]) {
                prefs = {
                    push: user.notificationPreferences[eventKey].push !== false,
                    email: user.notificationPreferences[eventKey].email !== false
                };
            }

            // Theme color and targetRole (Orange for clients, Blue for pros based on eventKey prefix)
            const isProEvent = eventKey.startsWith('prof_');
            const color = isProEvent ? '#2563EB' : '#EA580C';
            const targetRole = isProEvent ? 'pro' : 'client';

            // Enrich push data with targetRole
            const enrichedData = { ...data, targetRole };

            let pushResult = null;
            let emailSent = false;

            // Send Push
            if (prefs.push && user.pushToken) {
                pushResult = await this.sendPushNotification(user.pushToken, title, body, enrichedData);
            }

            // Send Email
            if (prefs.email && user.email) {
                try {
                    await sendEmail({
                        email: user.email,
                        subject: title,
                        message: body,
                        html: this.buildHtmlEmail(title, body, buttonText, buttonUrl ? `${buttonUrl}?role=${targetRole}` : null, color)
                    });
                    emailSent = true;
                    console.log(`[NotificationService] Email sent to ${user.email} for ${eventKey}`);
                } catch (emailErr) {
                    console.error(`[NotificationService] Failed to send email to ${user.email}:`, emailErr.message);
                }
            }

            return { pushResult, emailSent };
        } catch (err) {
            console.error(`[NotificationService] Error notifying user:`, err);
            return { pushResult: null, emailSent: false };
        }
    }
}

module.exports = NotificationService;
