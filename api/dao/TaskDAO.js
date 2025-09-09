const Task = require('../models/Task');
const GlobalDAO = require('./GlobalDAO');

class TaskDAO extends GlobalDAO {
  constructor() {
    super(Task);
  }

  // Obtener todas las tareas de un usuario específico
  async getByUserId(userId) {
    return await this.model.find({ userId }).sort({ fecha: 1, hora: 1 });
  }

  // Obtener tareas por usuario y estado
  async getByUserIdAndStatus(userId, estado) {
    return await this.model.find({ userId, estado }).sort({ fecha: 1, hora: 1 });
  }

  // Verificar si una tarea pertenece a un usuario
  async isTaskOwner(taskId, userId) {
    const task = await this.model.findOne({ _id: taskId, userId });
    return !!task;
  }
}

module.exports = new TaskDAO();