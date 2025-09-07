const express = require("express");
require("dotenv").config();
const cors = require("cors");
const routesLogin = require("./routes/login.js");
const routesRegister = require("./routes/register.js");
const { connectDB } = require("./config/database");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/auth", routesLogin);
app.use("/api/auth", routesRegister);
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