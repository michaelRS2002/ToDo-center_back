const express = require('express');
const { body } = require('express-validator');
const { loginUser, logoutUser } = require('../controllers/AuthController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post('/login', [
  body('correo').isEmail().withMessage('Correo electrónico inválido'),
  body('contrasena').notEmpty().withMessage('Contraseña es requerida'),
  body('contrasena').isLength({ min: 8 }).withMessage('Contraseña debe tener al menos 8 caracteres'),
], validateRequest, loginUser);

router.post('/logout', logoutUser);

module.exports = router;
