const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const BlacklistedToken = require('../models/BlacklistedToken');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * @fileoverview Controlador de autenticación para ToDo Center.
 * Maneja el registro, login y logout de usuarios según especificaciones US-1 y US-2.
 * 
 * @module controllers/AuthController
 * @requires ../models/User
 * @requires ../models/LoginAttempt  
 * @requires ../utils/jwt
 * @requires bcryptjs
 * @since 1.0.0
 */

/**
 * Registra un nuevo usuario en el sistema (US-1: Registro básico).
 * Implementa todas las validaciones y criterios de aceptación especificados.
 * 
 * @async
 * @function registerUser
 * @param {Express.Request} req - Objeto request de Express
 * @param {Express.Response} res - Objeto response de Express
 * @param {string} req.body.nombres - Nombres del usuario (2-50 caracteres)
 * @param {string} req.body.apellidos - Apellidos del usuario (2-50 caracteres)
 * @param {number} req.body.edad - Edad del usuario (≥13 años)
 * @param {string} req.body.correo - Email único válido
 * @param {string} req.body.contrasena - Contraseña segura (≥8 chars, validación compleja)
 * @param {string} req.body.confirmarContrasena - Confirmación de contraseña
 * @returns {Promise<void>} Respuesta HTTP 201 con datos del usuario o error
 * 
 * @example
 * // POST /api/auth/register
 * {
 *   "nombres": "Juan",
 *   "apellidos": "Pérez",
 *   "edad": 25,
 *   "correo": "juan@email.com",
 *   "contrasena": "MiPassword123!",
 *   "confirmarContrasena": "MiPassword123!"
 * }
 * 
 * @throws {400} Validación fallida o contraseñas no coinciden
 * @throws {409} Email ya registrado
 * @throws {500} Error interno del servidor
 */
const registerUser = async (req, res) => {
  try {
    const { nombres, apellidos, edad, correo, contrasena, confirmarContrasena } = req.body;
  
    
    // 1. VALIDACIÓN DE CONFIRMACIÓN DE CONTRASEÑA
    if (contrasena !== confirmarContrasena) {
      logger.httpError(400, '/api/auth/register', 'Passwords do not match', { email: correo });
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }
    
    // 2. VERIFICAR SI EL EMAIL YA EXISTE
    const existingEmail = await User.findOne({ correo: correo.toLowerCase() });
    if (existingEmail) {
      logger.auth('REGISTER', correo, 'FAILED - EMAIL_ALREADY_EXISTS', { code: 409 });
      return res.status(409).json({ // 409 Conflict como especifica US-1
        success: false,
        message: 'Este correo ya está registrado'
      });
    }
    
    
    // 3. CREAR NUEVO USUARIO
    const newUser = new User({
      nombres,
      apellidos,
      edad: parseInt(edad), // Asegurar que sea número
      correo: correo.toLowerCase(),
      contrasena // Se hasheará automáticamente por el middleware pre-save
   
    });
    
    // 4. GUARDAR EN MONGODB
    // 4. GUARDAR EN MONGODB
    const savedUser = await newUser.save();
    
    // 5. RESPUESTA HTTP 201 CON ID DEL USUARIO (como requiere US-1)
    // 5. RESPUESTA HTTP 201 CON ID DEL USUARIO (como requiere US-1)
    res.status(201).json({
      success: true,
      message: 'Cuenta creada con éxito',
      data: {
        id: savedUser._id,
        nombres: savedUser.nombres,
        apellidos: savedUser.apellidos,
        edad: savedUser.edad,
        correo: savedUser.correo,
        createdAt: savedUser.createdAt // ISO-8601 automático
      }
    });
    
    logger.auth('REGISTER', savedUser.correo, 'SUCCESS', { userId: savedUser._id });
    
  } catch (error) {
    logger.error('REGISTER', 'Error durante el registro', error);
    
    // MANEJO DE ERRORES ESPECÍFICOS
    if (error.name === 'ValidationError') {
      // Errores de validación de Mongoose
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de registro inválidos',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      // Error de duplicado de MongoDB
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Este correo ya está registrado`
      });
    }
    
    // Error 5xx genérico (como especifica US-1)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Intenta de nuevo más tarde'
    });
  }
};

/**
 * Autentica un usuario existente en el sistema (US-2: Login seguro).
 * Implementa rate limiting, control de intentos y seguridad avanzada.
 * 
 * @async
 * @function loginUser
 * @param {Express.Request} req - Objeto request de Express
 * @param {Express.Response} res - Objeto response de Express
 * @param {string} req.body.correo - Email del usuario
 * @param {string} req.body.contrasena - Contraseña del usuario
 * @returns {Promise<void>} Respuesta HTTP 200 con token JWT o error
 * 
 * @example
 * // POST /api/auth/login
 * {
 *   "correo": "juan@email.com",
 *   "contrasena": "MiPassword123!"
 * }
 * 
 * @throws {401} Credenciales inválidas
 * @throws {423} Cuenta bloqueada por intentos excesivos
 * @throws {429} Rate limit excedido por IP
 * @throws {500} Error interno del servidor
 */
const loginUser = async (req, res) => {
  const { correo, contrasena } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    const user = req.user; // Viene del middleware loginSecurity
    
    if (!user) {
      logger.auth('LOGIN', correo, 'FAILED - USER_NOT_FOUND', { ip: clientIP, code: 401 });
      await LoginAttempt.registerFailedAttempt(clientIP);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Usar el método comparePassword en lugar de comparación directa
    const isPasswordValid = await user.comparePassword(contrasena);
    
    if (!isPasswordValid) {
      logger.auth('LOGIN', correo, 'FAILED - INVALID_PASSWORD', { ip: clientIP, code: 401 });
      await user.incrementLoginAttempts();
      await LoginAttempt.registerFailedAttempt(clientIP);
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Resetear intentos fallidos al login exitoso
    await user.resetLoginAttempts();
    await LoginAttempt.clearAttempts(clientIP);
    
    // Generar token JWT usando la función importada
    const token = generateToken({
      _id: user._id,
      correo: user.correo,
      loginAt: Date.now() // Esto hará que cada token sea único por login
    });
    
    logger.auth('LOGIN', user.correo, 'SUCCESS', { userId: user._id });
    
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user._id,
          nombres: user.nombres,
          apellidos: user.apellidos,
          correo: user.correo
        }
      }
    });
    
  } catch (error) {
    logger.error('LOGIN', 'Error durante el login', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Cierra la sesión del usuario actual.
 * En implementaciones futuras podría invalidar el token JWT.
 * 
 * @function logoutUser
 * @param {Express.Request} req - Objeto request de Express
 * @param {Express.Response} res - Objeto response de Express
 * @returns {void} Respuesta HTTP 200 confirmando logout
 * 
 * @example
 * // POST /api/auth/logout
 * // Headers: Authorization: Bearer <token>
 */
const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }
    const token = authHeader.split(' ')[1];

    // Si tienes un middleware de autenticación, puedes usar req.user._id
    // Si no, puedes decodificar el token para obtener el userId si lo necesitas

    await BlacklistedToken.addToBlacklist(token, null, 'logout');

    res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al cerrar sesión'
    });
  }
};

module.exports = { 
  registerUser, 
  loginUser,
  logoutUser
};