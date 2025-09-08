const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/AuthController');
const { validateRegister, validateLogin, validateRequest } = require('../middleware/validation');
const loginSecurity = require('../middleware/loginSecurity');

const router = express.Router();

// Rutas de autenticación
router.post('/register', validateRegister, validateRequest, registerUser);
router.post('/login', validateLogin, validateRequest, loginSecurity, loginUser);
router.post('/logout', logoutUser);

module.exports = router;