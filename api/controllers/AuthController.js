const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  try {
    const { nombres, apellidos, edad, correo, contrasena, confirmarContrasena } = req.body;
  
    
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

const loginUser = async (req, res) => {
  const { correo, contrasena } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    const user = req.user; // Viene del middleware loginSecurity
    
    if (!user) {
      await LoginAttempt.registerFailedAttempt(clientIP);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Usar el método comparePassword en lugar de comparación directa
    const isPasswordValid = await user.comparePassword(contrasena);
    
    if (!isPasswordValid) {
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
      correo: user.correo
    });
    
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
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout exitoso'
  });
};

module.exports = { 
  registerUser, 
  loginUser,
  logoutUser
};