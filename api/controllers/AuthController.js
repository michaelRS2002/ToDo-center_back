const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

//Verificar contraseña con control de intentos
const comparePasswordWithRateLimit = async (user, candidatePassword) => {
  // Primero verificar si la cuenta está bloqueada
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error('CUENTA_BLOQUEADA');
  }
  
  // Comparar la contraseña ingresada con la hasheada en BD
  const isMatch = await bcrypt.compare(candidatePassword, user.contrasena);
  
  if (isMatch) { // Login exitoso
    await user.resetLoginAttempts();
    return true;
  } else { // Login fallido
    await user.incLoginAttempts();
    throw new Error('CONTRASEÑA_INCORRECTA');
  }
};

// MÉTODO PARA VERIFICAR CONTRASEÑA
const comparePassword = async (candidatePassword, user) => {
  return await bcrypt.compare(candidatePassword, user.contrasena);
};

const registerUser = async (req, res) => {
  try {
    const { nombres, apellidos, edad, correo, contrasena, confirmarContrasena, username } = req.body;
    
    // 1. VALIDACIÓN DE CONFIRMACIÓN DE CONTRASEÑA
    if (contrasena !== confirmarContrasena) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }
    
    // 2. VERIFICAR SI EL EMAIL YA EXISTE
    const existingEmail = await User.findOne({ correo: correo.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ // 409 Conflict como especifica US-1
        success: false,
        message: 'Este correo ya está registrado'
      });
    }
    
    // 3. VERIFICAR SI EL USERNAME YA EXISTE
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Este username ya está en uso'
      });
    }
    
    // 4. CREAR NUEVO USUARIO
    const newUser = new User({
      nombres,
      apellidos,
      edad: parseInt(edad), // Asegurar que sea número
      correo: correo.toLowerCase(),
      contrasena, // Se hasheará automáticamente por el middleware pre-save
      username
    });
    
    // 5. GUARDAR EN MONGODB
    const savedUser = await newUser.save();
    
    // 6. RESPUESTA HTTP 201 CON ID DEL USUARIO (como requiere US-1)
    res.status(201).json({
      success: true,
      message: 'Cuenta creada con éxito',
      data: {
        id: savedUser._id,
        nombres: savedUser.nombres,
        apellidos: savedUser.apellidos,
        edad: savedUser.edad,
        correo: savedUser.correo,
        username: savedUser.username,
        createdAt: savedUser.createdAt // ISO-8601 automático
      }
    });
    
    console.log(`usuario registrado exitosamente: ${savedUser.correo}`);
    
  } catch (error) {
    console.error('Error en registro:', error);
    
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
        message: `${field === 'correo' ? 'Este correo' : 'Este username'} ya está registrado`
      });
    }
    
    // Error 5xx genérico (como especifica US-1)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Intenta de nuevo más tarde'
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // 1. VALIDAR RATE LIMITTING POR IP
    try {
      await LoginAttempt.checkRateLimit(clientIP);
    } catch (error) {
      if (error.message === 'CUENTA_BLOQUEADA') {
        return res.status(429).json({
          success: false,
          message: 'Cuenta bloqueada. Intenta de nuevo más tarde',
          retryAfter: 600 // 10 minutos
        });
      }
      throw error;
    }

    // 2. VALIDAR CREDENCIALES
    const user = await User.findOne({ 
      correo: correo.toLowerCase(),
      isActive: true 
    });

    if (!user) {
      try {
        await LoginAttempt.registerFailedAttempt(clientIP);
      } catch (error) {
        if (error.message === 'IP_RATE_LIMITED') {
          return res.status(429).json({
            success: false,
            message: 'Demasiados intentos fallidos. Intenta despues de 10 minutos',
          });
        }
        throw error;
      }
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña inválidos'
      });
    }

    // 3. VALIDAR SI LA CUENTA ESTA BLOQUEADA
    if (user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Cuenta bloqueada. Intenta despues de 10 minutos',
      });
    }
    
    // 4. VERIFICAR CONTRASEÑA CON RATE LIMITING
    let isPasswordValid;
    try {
      isPasswordValid = await comparePasswordWithRateLimit(user, contrasena);
    } catch (error) {
      if (error.message === 'CUENTA_BLOQUEADA') {
        return res.status(423).json({
          success: false,
          message: 'Cuenta bloqueada. Intenta despues de 10 minutos',
        });
      }
      throw error;
    }

    if (!isPasswordValid) {
      try {
        await LoginAttempt.registerFailedAttempt(clientIP);
      } catch (error) {
        if (error.message === 'IP_RATE_LIMITED') {
          return res.status(429).json({
            success: false,
            message: 'Demasiados intentos fallidos. Intenta despues de 10 minutos',
          });
        }
      }
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña inválidos'
      });
    }

    // 5. LOGIN EXITOSO: GENERAR JWT
    const token = generateToken(user);
    
    // 6. RESETEAR CONTADORES DE INTENTOS FALLIDOS
    await LoginAttempt.resetAttempts(clientIP);

    // 7. DEVOLVER TOKEN Y DATOS DEL USUARIO
    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } finally {
    // 8. DESCONECTAR DE LA BASE DE DATOS
    await mongoose.disconnect();
  }
}

const logoutUser = (req, res) => {
  // In a real app, you might want to invalidate the token here
  res.status(200).json({
    success: true,
    message: 'Logout exitoso'
  });
};

module.exports = { 
  registerUser, 
  loginUser,
  logoutUser,
  comparePasswordWithRateLimit,
  comparePassword
};