const bcrypt = require('bcryptjs');
const { verifyToken } = require('../utils/jwt'); // Usar la función del jwt.js

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Usar la función verifyToken del utils/jwt.js
    const decoded = await verifyToken(token);
    
    console.log('Usuario decodificado del token:', decoded); // Debug
    req.user = decoded; // Contiene userId y correo
    next();
    
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    
    let message = 'Token inválido';
    let status = 403;
    
    switch (error.message) {
      case 'TOKEN_EXPIRED':
        message = 'Token expirado. Inicia sesión nuevamente';
        status = 401;
        break;
      case 'TOKEN_BLACKLISTED':
        message = 'Token revocado. Inicia sesión nuevamente';
        status = 401;
        break;
      case 'TOKEN_INVALID':
        message = 'Token inválido o malformado';
        status = 403;
        break;
    }
    
    return res.status(status).json({
      success: false,
      message: message
    });
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
