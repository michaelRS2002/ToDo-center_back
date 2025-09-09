const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Date,
    default: Date.now
  },
  blockedUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Método para verificar si está bloqueado
loginAttemptSchema.methods.isBlocked = function() {
  return this.blockedUntil && this.blockedUntil > new Date();
};

// Método para incrementar intentos fallidos
loginAttemptSchema.methods.incrementAttempts = function() {
  const maxAttempts = 5;
  const blockDuration = 10 * 60 * 1000; // 10 minutos en millisegundos
  
  this.attempts += 1;
  this.lastAttempt = new Date();
  
  if (this.attempts >= maxAttempts) {
    this.blockedUntil = new Date(Date.now() + blockDuration);
  }
  
  return this.save();
};

// Método para resetear intentos
loginAttemptSchema.methods.resetAttempts = function() {
  this.attempts = 0;
  this.blockedUntil = null;
  return this.save();
};

// Método estático para registrar intento fallido
loginAttemptSchema.statics.registerFailedAttempt = async function(ip) {
  const maxAttempts = 5;
  const blockDuration = 10 * 60 * 1000; // 10 minutos
  
  let attempt = await this.findOne({ ip });
  
  if (!attempt) {
    attempt = new this({ ip, attempts: 1 });
  } else {
    attempt.attempts += 1;
    attempt.lastAttempt = new Date();
    
    if (attempt.attempts >= maxAttempts) {
      attempt.blockedUntil = new Date(Date.now() + blockDuration);
    }
  }
  
  return await attempt.save();
};

// Método estático para limpiar intentos exitosos
loginAttemptSchema.statics.clearAttempts = async function(ip) {
  return await this.deleteOne({ ip });
};

// Índice TTL para eliminar documentos automáticamente después de 24 horas
loginAttemptSchema.index({ lastAttempt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);




