const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ionos.es',
        port: process.env.EMAIL_PORT || 465,
        secure: parseInt(process.env.EMAIL_PORT || 465, 10) === 465, // true para 465, false para 587
        auth: {
            user: process.env.EMAIL_USER || 'soporte@profesionalcercano.com',
            pass: process.env.EMAIL_PASS || 'tu_contraseña' 
        }
    });

    // Define the email options
    const mailOptions = {
        from: 'Profesional Cercano <soporte@profesionalcercano.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
