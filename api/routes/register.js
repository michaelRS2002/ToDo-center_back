const express = require('express');
const { body } = require('express-validator');
const { registerUser } = require('../controllers/AuthController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  // Validaciones con express-validator (adicionales a Mongoose)
  body('nombres')
    .trim()
    .notEmpty()
    .withMessage('Nombres son requeridos')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombres debe tener entre 2 y 50 caracteres'),
    
  body('apellidos')
    .trim()
    .notEmpty()
    .withMessage('Apellidos son requeridos')
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellidos debe tener entre 2 y 50 caracteres'),
    
  body('edad')
    .isInt({ min: 13, max: 120 })
    .withMessage('Edad debe ser un número entre 13 y 120'),
    
  body('correo')
    .isEmail()
    .withMessage('Formato de correo electrónico inválido')
    .normalizeEmail(),
    
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
    .withMessage('Contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'),
    
  body('confirmarContrasena')
    .custom((value, { req }) => {
      if (value !== req.body.contrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
    
], validateRequest, registerUser);

module.exports = router;