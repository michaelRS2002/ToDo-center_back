const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-super-seguro-aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// GENERAR TOKEN JWT
const generateToken = (user) => {
    // información que va dentro del token
  const payload = {
    userId: user._id,
    correo: user.correo
  };
  
  // Crear el token JWT con:
  // - payload: la información del usuario
  // - secret: clave secreta para firmar el token
  // - opciones: configuración adicional
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'task-manager-app', // emisor del token
    audience: 'task-manager-users' // audiencia del token
  });
};

// VERIFICAR TOKEN JWT
const verifyToken = async (token) => {
  try {
    // 1. Verificar si el token está en blacklist
    const isBlacklisted = await BlacklistedToken.isBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('TOKEN_BLACKLISTED');
    }
    
    // 2. Verificar firma y expiración
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('TOKEN_INVALID');
    } else {
      throw error;
    }
  }
};

// INVALIDAR TOKEN (para logout)
const invalidateToken = async (token, userId, reason = 'logout') => {
  await BlacklistedToken.addToBlacklist(token, userId, reason);
};

module.exports = {
  generateToken,
  verifyToken,
  invalidateToken
};