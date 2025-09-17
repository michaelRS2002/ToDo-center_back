const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const BlacklistedToken = require('../models/BlacklistedToken');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * @fileoverview Authentication controller for ToDo Center.
 * Handles user registration, login and logout according to US-1 and US-2 specifications.
 * 
 * @module controllers/AuthController
 * @requires ../models/User
 * @requires ../models/LoginAttempt  
 * @requires ../utils/jwt
 * @requires bcryptjs
 * @since 1.0.0
 */

/**
 * Registers a new user in the system (US-1: Basic registration).
 * Implements all specified validations and acceptance criteria.
 * 
 * @async
 * @function registerUser
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {string} req.body.nombres - User's first names (2-50 characters)
 * @param {string} req.body.apellidos - User's last names (2-50 characters)
 * @param {number} req.body.edad - User's age (≥13 years)
 * @param {string} req.body.correo - Valid unique email
 * @param {string} req.body.contrasena - Secure password (≥8 chars, complex validation)
 * @param {string} req.body.confirmarContrasena - Password confirmation
 * @returns {Promise<void>} HTTP 201 response with user data or error
 * 
 * @example
 * // POST /api/auth/register
 * {
 *   "nombres": "Juan",
 *   "apellidos": "Pérez",
 *   "edad": 25,
 *   "correo": "juan@email.com",
 *   "contrasena": "MyPassword123!",
 *   "confirmarContrasena": "MyPassword123!"
 * }
 * 
 * @throws {400} Validation failed or passwords don't match
 * @throws {409} Email already registered
 * @throws {500} Internal server error
 */
const registerUser = async (req, res) => {
  try {
    const { nombres, apellidos, edad, correo, contrasena, confirmarContrasena } = req.body;
  
    
    // 1. PASSWORD CONFIRMATION VALIDATION
    if (contrasena !== confirmarContrasena) {
      logger.httpError(400, '/api/auth/register', 'Passwords do not match', { email: correo });
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    // 2. CHECK IF EMAIL ALREADY EXISTS
    const existingEmail = await User.findOne({ correo: correo.toLowerCase() });
    if (existingEmail) {
      logger.auth('REGISTER', correo, 'FAILED - EMAIL_ALREADY_EXISTS', { code: 409 });
      return res.status(409).json({ // 409 Conflict as specified in US-1
        success: false,
        message: 'This email is already registered'
      });
    }
    
    
    // 3. CREATE NEW USER
    const newUser = new User({
      nombres,
      apellidos,
      edad: parseInt(edad), // Ensure it's a number
      correo: correo.toLowerCase(),
      contrasena // Will be hashed automatically by pre-save middleware
   
    });
    
    // 4. SAVE TO MONGODB
    // 4. SAVE TO MONGODB
    const savedUser = await newUser.save();
    
    // 5. HTTP 201 RESPONSE WITH USER ID (as required by US-1)
    // 5. HTTP 201 RESPONSE WITH USER ID (as required by US-1)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: savedUser._id,
        nombres: savedUser.nombres,
        apellidos: savedUser.apellidos,
        edad: savedUser.edad,
        correo: savedUser.correo,
        createdAt: savedUser.createdAt // Automatic ISO-8601
      }
    });
    
    logger.auth('REGISTER', savedUser.correo, 'SUCCESS', { userId: savedUser._id });
    
  } catch (error) {
    logger.error('REGISTER', 'Error during registration', error);
    
    // SPECIFIC ERROR HANDLING
    if (error.name === 'ValidationError') {
      // Mongoose validation errors
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid registration data',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      // MongoDB duplicate error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `This email is already registered`
      });
    }
    
    // Generic 5xx error (as specified in US-1)
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later'
    });
  }
};

/**
 * Authenticates an existing user in the system (US-2: Secure login).
 * Implements rate limiting, attempt control and advanced security.
 * 
 * @async
 * @function loginUser
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {string} req.body.correo - User's email
 * @param {string} req.body.contrasena - User's password
 * @returns {Promise<void>} HTTP 200 response with JWT token or error
 * 
 * @example
 * // POST /api/auth/login
 * {
 *   "correo": "juan@email.com",
 *   "contrasena": "MyPassword123!"
 * }
 * 
 * @throws {401} Invalid credentials
 * @throws {423} Account locked due to excessive attempts
 * @throws {429} Rate limit exceeded per IP
 * @throws {500} Internal server error
 */
const loginUser = async (req, res) => {
  const { correo, contrasena } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    const user = req.user; // Comes from loginSecurity middleware
    
    if (!user) {
      logger.auth('LOGIN', correo, 'FAILED - USER_NOT_FOUND', { ip: clientIP, code: 401 });
      await LoginAttempt.registerFailedAttempt(clientIP);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Use comparePassword method instead of direct comparison
    const isPasswordValid = await user.comparePassword(contrasena);
    
    if (!isPasswordValid) {
      logger.auth('LOGIN', correo, 'FAILED - INVALID_PASSWORD', { ip: clientIP, code: 401 });
      await user.incrementLoginAttempts();
      await LoginAttempt.registerFailedAttempt(clientIP);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Reset failed attempts on successful login
    await user.resetLoginAttempts();
    await LoginAttempt.clearAttempts(clientIP);
    
    // Generate JWT token using imported function
    const token = generateToken({
      _id: user._id,
      correo: user.correo,
      loginAt: Date.now() // This makes each token unique per login
    });
    
    logger.auth('LOGIN', user.correo, 'SUCCESS', { userId: user._id });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
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
    logger.error('LOGIN', 'Error during login', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logs out the current user.
 * In future implementations could invalidate the JWT token.
 * 
 * @function logoutUser
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @returns {void} HTTP 200 response confirming logout
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
        message: 'Token not provided'
      });
    }
    const token = authHeader.split(' ')[1];

    // If you have authentication middleware, you can use req.user._id
    // If not, you can decode the token to get the userId if needed

    await BlacklistedToken.addToBlacklist(token, null, 'logout');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error while logging out'
    });
  }
};

module.exports = { 
  registerUser, 
  loginUser,
  logoutUser
};