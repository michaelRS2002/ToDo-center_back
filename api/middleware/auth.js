const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../utils/jwt'); // Usar la función del jwt.js

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó un token de autenticación'
    });
  }

  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.message === 'TOKEN_BLACKLISTED') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'TOKEN_BLACKLISTED'
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  }
};
// MIDDLEWARE PRE-SAVE: Hash de contraseña con bcrypt (min 10 salt rounds)
const preSave = (schema) => {
  schema.pre('save', async function(next) {
    // Solo hashear si la contraseña es nueva o fue modificada
    if (!this.isModified('contrasena')) return next();
    
    try {
      // Hash con 12 salt rounds (más que el mínimo de 10)
      this.contrasena = bcrypt.hash(this.contrasena, 12);
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { authenticateToken, preSave };
