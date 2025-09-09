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
        // Solo validar fecha futura en actualizaciones, no en creación
        if (this.isNew) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'La fecha debe ser futura'
    }
  },
  
  hora: {
    type: String,
    required: [true, 'La hora es requerida'],
    validate: {
      validator: function(value) {
        // Validar formato HH:mm (24 horas)
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
      },
      message: 'Formato de hora inválido (HH:mm)'
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
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  toJSON: {
    transform: function(doc, ret) {
      // Formatear fechas para el frontend
      if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
      if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
      return ret;
    }
  }
});

// Índice para optimizar consultas por usuario y fecha
TaskSchema.index({ userId: 1, fecha: 1 });

module.exports = mongoose.model('Task', TaskSchema);