const mongoose = require('mongoose');
const crypto = require('crypto');

const PasswordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  token: {
    type: String,
    required: true,
    unique: true
  },
  
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
  },
  
  used: {
    type: Boolean,
    default: false
  },
  
  ipAddress: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índice TTL para eliminar tokens expirados automáticamente
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método estático para generar token único
PasswordResetTokenSchema.statics.generateToken = async function(userId, ipAddress) {
  // Eliminar tokens anteriores no usados del mismo usuario
  await this.deleteMany({ userId, used: false });
  
  // Generar token criptográficamente seguro
  const token = crypto.randomBytes(32).toString('hex');
  
  // Crear nuevo token
  const resetToken = new this({
    userId,
    token,
    ipAddress
  });
  
  return await resetToken.save();
};

// Método estático para validar token
PasswordResetTokenSchema.statics.validateToken = async function(token) {
  const resetToken = await this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
  
  return resetToken;
};

// Método para marcar token como usado
PasswordResetTokenSchema.methods.markAsUsed = async function() {
  this.used = true;
  return await this.save();
};

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);