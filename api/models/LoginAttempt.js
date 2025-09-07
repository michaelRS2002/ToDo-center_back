const mongoose = require('mongoose');

const LoginAttemptSchema = new mongoose.Schema({
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

// Elimina automáticamente registros antiguos (después de 1 hora)
// Es útil para no llenar la base de datos con datos temporales
LoginAttemptSchema.index({ lastAttempt: 1 }, { expireAfterSeconds: 3600 });

//Verificar si una IP puede hacer login
LoginAttemptSchema.statics.checkRateLimit = async function(ip) {
    const now = new Date();
    // Buscar si ya existe un registro para esta IP
    let attempt = await this.findOne({ ip });

    if (!attempt) {
        attempt = new this({ ip, attempts: 0 });
    }

    // Si la IP está bloqueada y aún no ha pasado el tiempo
    if (attempt.blockedUntil && attempt.blockedUntil > now) {
        throw new Error('CUENTA_BLOQUEADA');
    }

    // Si han pasado más de 10 minutos desde el último intento, resetear
    if (now - attempt.lastAttempt > 10 * 60 * 1000) {
        attempt.attempts = 0;
        attempt.blockedUntil = null;
    }

    return attempt;
}

//Registrar un intento fallido desde una IP
LoginAttemptSchema.statics.registerFailedAttempt = async function(ip) {
    const attempt = await this.checkRateLimit(ip);
    attempt.attempts += 1;
    attempt.lastAttempt = Date.now();
    if (attempt.attempts >= 5) {
        attempt.blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    }
    return attempt.save();

    if (attempt.blockedUntil) {
        throw new Error('CUENTA_BLOQUEADA');
    }
}

//Resetear intentos desde una IP despues de login exitoso
LoginAttemptSchema.statics.resetAttempts = async function(ip) {
    await this.deleteOne({ ip });
};

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);

    
    

