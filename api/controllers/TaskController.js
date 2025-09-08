const GlobalController = require('./GlobalController');
const TaskDAO = require('../dao/TaskDAO');

class TaskController extends GlobalController {
  constructor() {
    super(TaskDAO);
  }

  // Sobrescribir getAll para filtrar por usuario
  getAll = async (req, res) => {
    try {
      const userId = req.user.userId; // Viene del middleware auth
      const tasks = await this.dao.getByUserId(userId);
      
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error obteniendo tareas:', error);
      res.status(500).json({
        success: false,
        message: 'No pudimos obtener tus tareas, inténtalo más tarde'
      });
    }
  };

  // Sobrescribir create para agregar userId
  create = async (req, res) => {
    try {
      const userId = req.user.userId;
      const taskData = {
        ...req.body,
        userId
      };
      
      const newTask = await this.dao.create(taskData);
      
      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        data: newTask
      });
    } catch (error) {
      console.error('Error creando tarea:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => {
          // Mapear mensajes específicos según requerimientos
          if (err.path === 'titulo' && err.kind === 'required') {
            return 'Completa este campo';
          }
          if (err.path === 'fecha' && err.message.includes('futura')) {
            return 'La fecha debe ser futura';
          }
          return err.message;
        });
        
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: messages
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'No pudimos guardar tu tarea, inténtalo de nuevo'
      });
    }
  };

  // Sobrescribir update para verificar propiedad
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      // Verificar que la tarea pertenece al usuario
      const isOwner = await this.dao.isTaskOwner(id, userId);
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }
      
      const updatedTask = await this.dao.update(id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Tarea actualizada',
        data: updatedTask
      });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => {
          if (err.path === 'fecha' && err.message.includes('futura')) {
            return 'La fecha debe ser futura';
          }
          if (err.path === 'titulo' && err.kind === 'required') {
            return 'Completa este campo';
          }
          return err.message;
        });
        
        return res.status(400).json({
          success: false,
          message: 'La fecha debe ser futura',
          errors: messages
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'No pudimos actualizar tu tarea'
      });
    }
  };

  // Sobrescribir delete para verificar propiedad
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      // Verificar que la tarea pertenece al usuario
      const isOwner = await this.dao.isTaskOwner(id, userId);
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          message: 'La tarea ya no está disponible'
        });
      }
      
      await this.dao.delete(id);
      
      res.status(204).json(); // Sin contenido
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      res.status(500).json({
        success: false,
        message: 'No pudimos eliminar la tarea, inténtalo más tarde'
      });
    }
  };

  // Obtener tareas por estado
  getByStatus = async (req, res) => {
    try {
      const { status } = req.params;
      const userId = req.user.userId;
      
      const tasks = await this.dao.getByUserIdAndStatus(userId, status);
      
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      console.error('Error obteniendo tareas por estado:', error);
      res.status(500).json({
        success: false,
        message: 'No pudimos obtener tus tareas, inténtalo más tarde'
      });
    }
  };
}

module.exports = new TaskController();