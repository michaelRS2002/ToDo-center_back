const mongoose = require('mongoose');

const BlacklistedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
      
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
      
    reason: {
        type: String,
        enum: ['logout', 'security', 'expired'],
        default: 'logout'
    },
      
    blacklistedAt: {
        type: Date,
        default: Date.now
    }      
}, {
    timestamps: true
});

// Auto-expirar tokens después de 2 horas (tiempo de vida del JWT)
BlacklistedTokenSchema.index({ blacklistedAt: 1 }, { expireAfterSeconds: 7200 });

// VERIFICAR SI UN TOKEN ESTÁ EN BLACKLIST
BlacklistedTokenSchema.statics.isBlacklisted = async function(token) {
    const blacklisted = await this.findOne({ token });
    return !!blacklisted;
};

// AGREGAR TOKEN A BLACKLIST
BlacklistedTokenSchema.statics.addToBlacklist = async function(token, userId, reason = 'logout') {
    try {
      await this.create({ token, userId, reason });
    } catch (error) {
      // Si ya existe, no es problema
      if (error.code !== 11000) {
        throw error;
      }
    }
};

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);