const express = require("express");
require("dotenv").config();
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const passwordResetRoutes = require("./routes/passWordResetRoutes");
const { connectDB } = require("./config/database");

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Rutas
app.use("/api/auth", authRoutes);      // login, register, logout
app.use("/api/users", userRoutes);     // CRUD usuarios
app.use("/api/password-reset", passwordResetRoutes); // Nueva ruta
app.get("/", (req, res) => res.send("Server is running"));

// Only start the server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    });
}

module.exports = app;