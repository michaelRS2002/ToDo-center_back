const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Campos requeridos por US-1
  nombres: {
    type: String,
    required: [true, 'Nombres son requeridos'],
    trim: true,
    minlength: [2, 'Nombres debe tener al menos 2 caracteres'],
    maxlength: [50, 'Nombres no puede exceder 50 caracteres']
  },
  
  apellidos: {
    type: String,
    required: [true, 'Apellidos son requeridos'],
    trim: true,
    minlength: [2, 'Apellidos debe tener al menos 2 caracteres'],
    maxlength: [50, 'Apellidos no puede exceder 50 caracteres']
  },
  
  edad: {
    type: Number,
    required: [true, 'Edad es requerida'],
    min: [13, 'Edad debe ser mayor o igual a 13 años'],
    max: [120, 'Edad no puede exceder 120 años'],
    validate: {
      validator: Number.isInteger,
      message: 'Edad debe ser un número entero'
    }
  },
  
  correoElectronico: {
    type: String,
    required: [true, 'Correo electrónico es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // RFC 5322 regex simplificado pero robusto
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
      },
      message: 'Formato de correo electrónico inválido'
    }
  },
  
  contrasena: {
    type: String,
    required: [true, 'Contraseña es requerida'],
    minlength: [8, 'Contraseña debe tener al menos 8 caracteres'],
    validate: {
      validator: function(password) {
        // Al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
    }
  },
  
  // Campos adicionales para el sistema
  username: {
    type: String,
    required: [true, 'Username es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'Username debe tener al menos 3 caracteres'],
    maxlength: [20, 'Username no puede exceder 20 caracteres'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username solo puede contener letras, números, guiones y guión bajo']
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true, // Crea automáticamente createdAt y updatedAt en ISO-8601
  toJSON: {
    transform: function(doc, ret) {
      // No incluir contrasena en respuestas JSON
      delete ret.contrasena;
      return ret;
    }
  }
});

// MIDDLEWARE PRE-SAVE: Hash de contraseña con bcrypt (min 10 salt rounds)
UserSchema.pre('save', async function(next) {
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

// MÉTODO PARA VERIFICAR CONTRASEÑA
UserSchema.methods.compararContrasena = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

// ÍNDICES PARA OPTIMIZACIÓN
UserSchema.index({ correoElectronico: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);