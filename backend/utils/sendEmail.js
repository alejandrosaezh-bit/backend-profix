const nodemailer = require('nodemailer');

const OFFICIAL_SMTP_HOST = 'smtp.ionos.es';
const OFFICIAL_SMTP_PORT = 465;
const OFFICIAL_SMTP_USER = 'info@profesionalcercano.com';
const OFFICIAL_SMTP_PASS = 'ProCercano2026!Venezuela#99';

const PRIMARY_RELAY_URL =
    process.env.EMAIL_RELAY_URL || 'https://www.profesionalcercano.com/api/send-email';
const PRIMARY_RELAY_KEY =
    process.env.INTERNAL_EMAIL_KEY || 'procercano_internal_mail_2026';

const BACKUP_RELAY_URL = 'https://www.iacondo.com/api/send-email';
const BACKUP_RELAY_KEY = 'iacondo_internal_mail_2026';

function resolveSmtpConfig() {
    const rawHost = String(process.env.EMAIL_HOST || '').trim();
    const rawPort = parseInt(String(process.env.EMAIL_PORT || '').trim(), 10);
    const rawUser = String(process.env.EMAIL_USER || '').trim();
    const rawPass = String(process.env.EMAIL_PASS || '').replace(/^["']|["']$/g, '').trim();

    // Ignorar credenciales antiguas dadas de baja si aún estuvieran en variables de entorno previas
    const isLegacyInvalid =
        !rawUser ||
        !rawPass ||
        rawPass === 'tu_contraseña' ||
        rawPass === 'vzUBHhJEe4C4-*C' ||
        (rawUser.toLowerCase() === 'soporte@profesionalcercano.com' && rawPass.startsWith('vzUBHh'));

    if (isLegacyInvalid) {
        return {
            host: OFFICIAL_SMTP_HOST,
            port: OFFICIAL_SMTP_PORT,
            user: OFFICIAL_SMTP_USER,
            pass: OFFICIAL_SMTP_PASS
        };
    }

    return {
        host: rawHost || OFFICIAL_SMTP_HOST,
        port: Number.isFinite(rawPort) && rawPort > 0 ? rawPort : OFFICIAL_SMTP_PORT,
        user: rawUser,
        pass: rawPass
    };
}

async function postViaHttpsRelay(relayUrl, relayKey, payload) {
    const res = await fetch(relayUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': relayKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Relay HTTP ${res.status}: ${errBody}`);
    }
    return res.json().catch(() => ({ ok: true }));
}

const sendEmail = async (options = {}) => {
    const recipient = options.email || options.to;
    if (!recipient) return false;

    const smtp = resolveSmtpConfig();
    const fromName = String(options.fromName || 'Profesional Cercano').replace(/"/g, '').trim();

    // 1. Intento directo vía IONOS SMTP (funciona en local y servidores sin bloqueo de puerto 465/587)
    try {
        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.port === 465,
            connectionTimeout: 5000,
            greetingTimeout: 4000,
            socketTimeout: 6000,
            auth: {
                user: smtp.user,
                pass: smtp.pass
            }
        });

        await Promise.race([
            transporter.sendMail({
                from: `"${fromName}" <${smtp.user}>`,
                replyTo: smtp.user,
                to: recipient,
                subject: options.subject,
                text: options.message || options.text,
                html: options.html
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Direct SMTP connection timeout')), 6500)
            )
        ]);

        console.log(`[Email] Correo enviado por IONOS SMTP (${smtp.user}) a ${recipient}`);
        return true;
    } catch (smtpErr) {
        console.warn(
            `[Email] SMTP directo no disponible (${smtpErr.message}), enviando por Relay HTTPS (puerto 443)...`
        );
    }

    const relayPayload = {
        to: recipient,
        subject: options.subject,
        text: options.message || options.text,
        html: options.html,
        fromName,
        fromEmail: smtp.user,
        replyTo: smtp.user,
        customSmtp: {
            host: smtp.host,
            port: smtp.port,
            user: smtp.user,
            pass: smtp.pass
        }
    };

    // 2. Fallback automático por HTTPS (puerto 443, nunca bloqueado en Render) en www.profesionalcercano.com
    try {
        await postViaHttpsRelay(PRIMARY_RELAY_URL, PRIMARY_RELAY_KEY, relayPayload);
        console.log(`[Email Relay HTTPS] Correo enviado vía profesionalcercano.com a ${recipient}`);
        return true;
    } catch (primaryRelayErr) {
        console.warn(`[Email Relay] Aviso en relay primario (${primaryRelayErr.message}), probando relay de respaldo...`);
    }

    // 3. Respaldo secundario HTTPS manteniendo remitente oficial @profesionalcercano.com vía customSmtp
    await postViaHttpsRelay(BACKUP_RELAY_URL, BACKUP_RELAY_KEY, relayPayload);
    console.log(`[Email Relay Backup] Correo enviado exitosamente como ${smtp.user} a ${recipient}`);
    return true;
};

module.exports = sendEmail;
