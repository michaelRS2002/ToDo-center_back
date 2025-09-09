const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../utils/emailService'); // Necesitarás implementar esto

const requestPasswordReset = async (req, res) => {
  try {
    const { correo } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Buscar usuario por correo
    const user = await User.findOne({ correo: correo.toLowerCase() });
    
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return res.status(200).json({
        success: true,
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }
    
    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }
    
    // Generar token de recuperación
    const resetToken = await PasswordResetToken.generateToken(user._id, clientIP);
    
    // Enviar email con el token (necesitarás configurar un servicio de email)
    await sendPasswordResetEmail(user.correo, resetToken.token, user.nombres);
    
    res.status(200).json({
      success: true,
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
    });
    
  } catch (error) {
    console.error('Error en solicitud de reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, nuevaContrasena, confirmarContrasena } = req.body;
    
    // Validar que las contraseñas coincidan
    if (nuevaContrasena !== confirmarContrasena) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }
    
    // Validar el token
    const resetToken = await PasswordResetToken.validateToken(token);
    
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    // Obtener el usuario
    const user = resetToken.userId;
    
    // Cambiar la contraseña
    await user.resetPassword(nuevaContrasena);
    
    // Marcar token como usado
    await resetToken.markAsUsed();
    
    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
    
  } catch (error) {
    console.error('Error en reset de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const resetToken = await PasswordResetToken.validateToken(token);
    
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        userEmail: resetToken.userId.correo,
        expiresAt: resetToken.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
};