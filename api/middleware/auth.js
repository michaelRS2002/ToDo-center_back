const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó un token de autenticación'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    req.user = user;
    next();
  });
};
// MIDDLEWARE PRE-SAVE: Hash de contraseña con bcrypt (min 10 salt rounds)
const preSave = (schema) => {
  schema.pre('save', async function(next) {
    // Solo hashear si la contraseña es nueva o fue modificada
    if (!this.isModified('contrasena')) return next();
    
    try {
      // Hash con 12 salt rounds (más que el mínimo de 10)
      this.contrasena = await bcrypt.hash(this.contrasena, 12);
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { authenticateToken, preSave };
