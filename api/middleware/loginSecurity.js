const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');

const loginSecurity = async (req, res, next) => {
  const { correo } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  console.log('🔍 LoginSecurity - Email recibido:', correo);
  
  try {
    // 1. VERIFICAR RATE LIMITING POR IP
    const ipAttempts = await LoginAttempt.findOne({ ip: clientIP });
    if (ipAttempts && ipAttempts.isBlocked()) {
      console.log('❌ IP bloqueada:', clientIP);
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos fallidos desde esta IP. Intenta después de 10 minutos'
      });
    }
    
    // 2. VERIFICAR SI EL USUARIO EXISTE Y SI ESTÁ BLOQUEADO
    const user = await User.findOne({ correo: correo?.toLowerCase() });
    console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');
    
    if (user && user.isAccountLocked()) {
      console.log('🔒 Cuenta bloqueada');
      return res.status(423).json({
        success: false,
        message: 'Cuenta bloqueada. Intenta después de 10 minutos'
      });
    }
    
    // 3. PASAR EL USUARIO AL SIGUIENTE MIDDLEWARE/CONTROLADOR
    req.user = user;
    console.log('✅ Pasando al siguiente middleware');
    next();
    
  } catch (error) {
    console.error('💥 Error en seguridad de login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = loginSecurity;