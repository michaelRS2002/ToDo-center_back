const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { authenticateToken } = require("../middleware/auth");

// Todas las rutas de usuarios requieren autenticación
router.use(authenticateToken);

router.get("/", UserController.getAll);
router.get("/:id", UserController.read);
router.post("/", UserController.create);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);

module.exports = router;
