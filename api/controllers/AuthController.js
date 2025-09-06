const User = require('../models/User');

const registerUser = async (req, res) => {
  try {
    const { nombres, apellidos, edad, correoElectronico, contrasena, confirmarContrasena, username } = req.body;
    
    // 1. VALIDACIÓN DE CONFIRMACIÓN DE CONTRASEÑA
    if (contrasena !== confirmarContrasena) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }
    
    // 2. VERIFICAR SI EL EMAIL YA EXISTE
    const existingEmail = await User.findOne({ correoElectronico: correoElectronico.toLowerCase() });
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
      correoElectronico: correoElectronico.toLowerCase(),
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
        correoElectronico: savedUser.correoElectronico,
        contrasena: savedUser.contrasena,
        username: savedUser.username,
        createdAt: savedUser.createdAt // ISO-8601 automático
      }
    });
    
    console.log(`✅ Nuevo usuario registrado: ${savedUser.correoElectronico}`);
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
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
        message: `${field === 'correoElectronico' ? 'Este correo' : 'Este username'} ya está registrado`
      });
    }
    
    // Error 5xx genérico (como especifica US-1)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor. Intenta de nuevo más tarde'
    });
  }
};

module.exports = { registerUser };