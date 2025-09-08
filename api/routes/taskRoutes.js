const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateCreateTask, 
  validateUpdateTask, 
  validateRequest 
} = require('../middleware/taskValidation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD básico
router.get('/', TaskController.getAll);
router.get('/:id', TaskController.read);
router.post('/', validateCreateTask, validateRequest, TaskController.create);
router.put('/:id', validateUpdateTask, validateRequest, TaskController.update);
router.delete('/:id', TaskController.delete);

// Ruta adicional para filtrar por estado
router.get('/status/:status', TaskController.getByStatus);

module.exports = router;