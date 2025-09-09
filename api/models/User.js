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
  
  correo: {
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
        
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(password);
      },
      message: 'Contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'
    }
  },
  //Campos para US-2
  lastLogin: {
    type: Date,
    default: Date.now
  },

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date
  },

  isLocked: {
    type: Boolean,
    default: false
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
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Middleware para hashear la contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('contrasena')) return next();
  
  try {
    // Generar salt y hashear la contraseña
    const salt = await bcrypt.genSalt(12);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

//validar si la cuenta está bloqueada
UserSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

//resetear intentos despues de login exitoso
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { lockUntil: 1, loginAttempts: 1 }, // Quitar campos de bloqueo
    $set: { 
      lastLogin: new Date(),  // Actualizar último acceso
      isLocked: false       // Marcar como no bloqueado
    }
  });
};

UserSchema.methods.incrementLoginAttempts = function() {
  const maxAttempts = 5;
  const lockTime = 10 * 60 * 1000; // 10 minutos
  
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = {
      lockUntil: Date.now() + lockTime
    };
  }
  
  return this.updateOne(updates);
};

// Agregar este método al UserSchema
UserSchema.methods.resetPassword = async function(newPassword) {
  this.contrasena = newPassword;
  // Resetear intentos de login al cambiar contraseña
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.isLocked = false;
  return await this.save();
};

module.exports = mongoose.model('User', UserSchema);