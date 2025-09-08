const express = require('express');
const { 
  requestPasswordReset, 
  resetPassword, 
  verifyResetToken 
} = require('../controllers/PasswordResetController');
const { 
  validatePasswordResetRequest, 
  validatePasswordReset, 
  validateRequest 
} = require('../middleware/validation');

const router = express.Router();

// Solicitar reset de contraseña
router.post('/request', 
  validatePasswordResetRequest, 
  validateRequest, 
  requestPasswordReset
);

// Verificar si un token es válido
router.get('/verify/:token', verifyResetToken);

// Restablecer contraseña
router.post('/reset', 
  validatePasswordReset, 
  validateRequest, 
  resetPassword
);

module.exports = router;