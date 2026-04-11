const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'soporte.profix.app@gmail.com', // Dummy default if not set
            pass: process.env.EMAIL_PASS || 'tu_contraseña_de_aplicacion' 
        }
    });

    // Define the email options
    const mailOptions = {
        from: 'ProFix App <noply@profixapp.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
