require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const testSMTP = async () => {
    console.log("Testing SMTP connection with IONOS...");
    console.log(`Host: ${process.env.EMAIL_HOST}, Port: ${process.env.EMAIL_PORT}, User: ${process.env.EMAIL_USER}`);
    
    try {
        await sendEmail({
            email: 'soporte@profesionalcercano.com', // Enviar a sí mismo como prueba
            subject: 'Prueba de conexión SMTP',
            message: 'Si recibes este correo, la configuración SMTP en local está funcionando correctamente.',
            html: '<p>Si recibes este correo, la configuración <b>SMTP</b> en local está funcionando correctamente.</p>'
        });
        console.log("✅ EMAIL SENT SUCCESSFULLY!");
    } catch (error) {
        console.error("❌ ERROR SENDING EMAIL:");
        console.error(error);
    }
};

testSMTP();
