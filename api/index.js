const express = require("express");
require("dotenv").config();
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const passwordResetRoutes = require("./routes/passWordResetRoutes");
const taskRoutes = require("./routes/taskRoutes"); 
const { connectDB } = require("./config/database");
const { swaggerSetup } = require("./config/swagger");
const logger = require("./utils/logger");

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS según el entorno
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3000'] // Desarrollo
    : ['https://to-do-center-front.vercel.app'], // Producción
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// Middleware de logging de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            logger.request(req.method, req.originalUrl, res.statusCode, ip);
            
            if (duration > 1000) {
                logger.warn('PERFORMANCE', `Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
            }
        });
        
        next();
    });
}

// Configurar documentación Swagger
swaggerSetup(app);

// Rutas
app.use("/api/auth", authRoutes);      // login, register, logout
app.use("/api/users", userRoutes);     // CRUD usuarios
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/tasks", taskRoutes);  
app.get("/", (req, res) => res.send("Server is running - <a href='/api-docs'>Ver documentación API</a>"));

// Only start the server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            logger.server(PORT, `http://localhost:${PORT}/api-docs`);
        });
    }).catch(error => {
        logger.error('DATABASE', 'Failed to connect to MongoDB', error);
        process.exit(1);
    });
}

module.exports = app;