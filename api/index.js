const express = require("express");
require("dotenv").config();
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const passwordResetRoutes = require("./routes/passWordResetRoutes");
const taskRoutes = require("./routes/taskRoutes"); 
const { connectDB } = require("./config/database");
const { swaggerSetup } = require("./config/swagger");

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5173', // Cambia el puerto si tu frontend usa otro
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        });
    });
}

module.exports = app;