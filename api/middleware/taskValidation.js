const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => {
      // Mapear mensajes específicos según requerimientos
      if (error.param === 'titulo' && error.msg.includes('Empty')) {
        return { ...error, msg: 'Completa este campo' };
      }
      if (error.param === 'fecha' && error.msg.includes('anterior')) {
        return { ...error, msg: 'La fecha debe ser futura' };
      }
      return error;
    });
    
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: formattedErrors
    });
  }
  next();
};

// Validaciones para crear tarea
const validateCreateTask = [
  body('titulo')
    .trim()
    .notEmpty()
    .withMessage('Completa este campo')
    .isLength({ max: 50 })
    .withMessage('El título no puede exceder 50 caracteres'),
  
  body('detalle')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El detalle no puede exceder 500 caracteres'),
  
  body('fecha')
    .isISO8601()
    .withMessage('Formato de fecha inválido')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (inputDate < today) {
        throw new Error('La fecha debe ser futura');
      }
      return true;
    }),
  
  body('start')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora de inicio inválido (HH:mm)'),

  body('end')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora de fin inválido (HH:mm)'),
  
  body('estado')
    .isIn(['Por hacer', 'Haciendo', 'Hecho'])
    .withMessage('Estado inválido')
];

// Validaciones para actualizar tarea
const validateUpdateTask = [
  body('titulo')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Completa este campo')
    .isLength({ max: 50 })
    .withMessage('El título no puede exceder 50 caracteres'),
  
  body('detalle')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El detalle no puede exceder 500 caracteres'),
  
  body('fecha')
    .optional()
    .isISO8601()
    .withMessage('Formato de fecha inválido')
    .custom((value) => {
      if (value) {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (inputDate < today) {
          throw new Error('La fecha debe ser futura');
        }
      }
      return true;
    }),
  
  body('start')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora de inicio inválido (HH:mm)'),

  body('end')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora de fin inválido (HH:mm)'),
  
  body('estado')
    .optional()
    .isIn(['Por hacer', 'Haciendo', 'Hecho'])
    .withMessage('Estado inválido')
];

module.exports = {
  validateRequest,
  validateCreateTask,
  validateUpdateTask
};