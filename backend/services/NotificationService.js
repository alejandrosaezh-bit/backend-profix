const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const https = require('https');

class NotificationService {
    /**
     * Send Push Notification
     */
    static async sendPushNotification(pushToken, title, body, data = {}) {
        if (!pushToken) return;
        data.type = data.type || 'job_update';

        const message = {
            to: pushToken,
            sound: 'default',
            channelId: 'default',
            title: title,
            body: body,
            data: data,
        };

        const dataString = JSON.stringify([message]);

        const options = {
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Length': dataString.length,
            },
        };

        try {
            const req = https.request(options, (res) => {
                res.on('data', () => {});
            });
            req.on('error', (e) => console.error('Error sending push notification:', e));
            req.write(dataString);
            req.end();
        } catch (e) {
            console.error("Exception sending push:", e);
        }
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

            // Theme color (Orange for clients, Blue for pros based on eventKey prefix)
            const color = eventKey.startsWith('prof_') ? '#2563EB' : '#EA580C';

            // Send Push
            if (prefs.push && user.pushToken) {
                await this.sendPushNotification(user.pushToken, title, body, data);
            }

            // Send Email
            if (prefs.email && user.email) {
                const htmlContent = this.buildHtmlEmail(title, body, buttonText, buttonUrl, color);
                try {
                    await sendEmail({
                        email: user.email,
                        subject: title,
                        message: body,
                        html: htmlContent
                    });
                    console.log(`[NotificationService] Email sent to ${user.email} for ${eventKey}`);
                } catch (emailErr) {
                    console.error(`[NotificationService] Failed to send email to ${user.email}:`, emailErr.message);
                }
            }
        } catch (err) {
            console.error(`[NotificationService] Error notifying user:`, err);
        }
    }
}

module.exports = NotificationService;
