// mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar transporter con nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE=== "true", // true o false según .env
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


// Función para enviar correo de restablecimiento de contraseña
const sendPasswordResetEmail = async (email, token, nombres) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${token}`;

  const mailOptions = {
    from: '"ToDo Center" <${process.env.EMAIL_USER}>',
    to: email,
    subject: 'Restablecer Contraseña - ToDo Center',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">ToDo Center</h1>
        </div>
        
        <h2 style="color: #333;">Restablecer Contraseña</h2>
        
        <p>Hola <strong>${nombres}</strong>,</p>
        
        <p>Recibimos una solicitud para restablecer tu contraseña en ToDo Center.</p>
        
        <p>Para continuar con el proceso, haz clic en el siguiente botón:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666;"><strong>⚠️ Importante:</strong></p>
          <ul style="color: #666; margin: 10px 0;">
            <li>Este enlace expirará en <strong>15 minutos</strong> por seguridad</li>
            <li>Solo puedes usar este enlace una vez</li>
            <li>Si no solicitaste este cambio, ignora este email</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Este es un mensaje automático de ToDo Center. Por favor, no respondas a este email.
        </p>
        
        <p style="color: #999; font-size: 12px;">
          Si tienes problemas con el enlace, copia y pega esta URL en tu navegador:<br>
          <span style="word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `
  };

  console.log('📧 Enviando email de reset a:', email);
  console.log('🔗 URL de reset:', resetUrl);
  
  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail
};
