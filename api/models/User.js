const mongoose = require('mongoose');
const { preSave } = require('../middleware/auth');

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
    type: Date,
    default: null
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

// Aplicar el middleware preSave al esquema
preSave(UserSchema);

//validar si la cuenta está bloqueada
UserSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

//Metodo para incrementar intentos fallidos
/*UserSchema.methods.incLoginAttempts = function() {
  //resetear si pasó el tiempo de bloqueo
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.model('User').updateOne(
      { _id: this._id },
      {
        $unset: { lockUntil: 1 },
        $set: { loginAttempts: 0, isLocked: false }
      }
    );
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Si alcanzó el máximo de intentos (5), bloquear por 10 minutos
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = {
      lockUntil: Date.now() + (10 * 60 * 1000), // 10 minutos
      isLocked: true
    };
  }

  return this.model('User').updateOne(
    { _id: this._id },
    updates
  );
};*/

//resetear intentos despues de login exitoso
UserSchema.methods.resetLoginAttempts = function() {
  return this.model('User').updateOne({
    $unset: { lockUntil: 1, loginAttempts: 1 }, // Quitar campos de bloqueo
    $set: { 
      lastLogin: new Date(),  // Actualizar último acceso
      isLocked: false       // Marcar como no bloqueado
    }
  });
};

// ÍNDICES PARA OPTIMIZACIÓN
//UserSchema.index({ correo: 1 }, { unique: true });
//UserSchema.index({ username: 1 }, { unique: true });
//UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);