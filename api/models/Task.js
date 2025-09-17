const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [50, 'El título no puede exceder 50 caracteres']
  },
  
  detalle: {
    type: String,
    trim: true,
    maxlength: [500, 'El detalle no puede exceder 500 caracteres'],
    default: ''
  },
  
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    validate: {
      validator: function(value) {
        if (this.isNew) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'La fecha debe ser futura'
    }
  },

  start: {
    type: String,
    required: [true, 'La hora de inicio es requerida'],
    validate: {
      validator: function(value) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Formato de hora de inicio inválido (HH:mm)'
    }
  },

  end: {
    type: String,
    required: [true, 'La hora de fin es requerida'],
    validate: {
      validator: function(value) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Formato de hora de fin inválido (HH:mm)'
    }
  },
  
  estado: {
    type: String,
    required: [true, 'El estado es requerido'],
    enum: {
      values: ['Por hacer', 'Haciendo', 'Hecho'],
      message: 'Estado debe ser: Por hacer, Haciendo o Hecho'
    },
    default: 'Por hacer'
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
      if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
      return ret;
    }
  }
});

TaskSchema.index({ userId: 1, fecha: 1 });

module.exports = mongoose.model('Task', TaskSchema);