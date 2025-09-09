const mongoose = require("mongoose");
const logger = require("../utils/logger");
require("dotenv").config();

const connectDB = async () => {
  try {
    logger.info('DATABASE', 'Intentando conectar a MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const dbName = mongoose.connection.db.databaseName;
    logger.success('DATABASE', `Conectado exitosamente a MongoDB: ${dbName}`);
    
  } catch (error) {
    logger.error('DATABASE', 'Error al conectar a MongoDB', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    logger.info('DATABASE', 'Desconectando de MongoDB...');
    await mongoose.disconnect();
    logger.success('DATABASE', 'Desconectado de MongoDB');
  } catch (error) {
    logger.error('DATABASE', 'Error al desconectar de MongoDB', error);
  }
};

module.exports = { connectDB, disconnectDB };