const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { authenticateToken } = require("../middleware/auth");

// Todas las rutas de usuarios requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: ID único del usuario
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           description: Nombres del usuario
 *                           example: "Juan Carlos"
 *                         lastName:
 *                           type: string
 *                           description: Apellidos del usuario
 *                           example: "Pérez García"
 *                         age:
 *                           type: integer
 *                           description: Edad del usuario
 *                           example: 25
 *                         email:
 *                           type: string
 *                           format: email
 *                           description: Correo electrónico del usuario
 *                           example: "juan.perez@email.com"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Fecha de creación de la cuenta
 *                           example: "2023-12-01T10:30:00.000Z"
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", (req, res) => UserController.getProfile(req, res));

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - age
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Nombres del usuario
 *                 example: "Juan Carlos"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Apellidos del usuario
 *                 example: "Pérez García"
 *               age:
 *                 type: integer
 *                 minimum: 13
 *                 maximum: 120
 *                 description: Edad del usuario
 *                 example: 26
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: "juan.perez.nuevo@email.com"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Perfil actualizado exitosamente"
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "Juan Carlos"
 *                         lastName:
 *                           type: string
 *                           example: "Pérez García"
 *                         age:
 *                           type: integer
 *                           example: 26
 *                         email:
 *                           type: string
 *                           example: "juan.perez.nuevo@email.com"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-01T10:30:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-15T14:20:00.000Z"
 *       400:
 *         description: Errores de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               camposFaltantes:
 *                 summary: Campos requeridos faltantes
 *                 value:
 *                   success: false
 *                   message: "Todos los campos son requeridos"
 *               edadMinima:
 *                 summary: Edad menor al mínimo
 *                 value:
 *                   success: false
 *                   message: "La edad mínima es 13 años"
 *               emailInvalido:
 *                 summary: Formato de email inválido
 *                 value:
 *                   success: false
 *                   message: "Formato de email inválido"
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ya registrado por otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "El email ya está registrado por otro usuario"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/me", (req, res) => UserController.updateProfile(req, res));

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Eliminar cuenta del usuario autenticado
 *     description: Elimina permanentemente la cuenta del usuario. Requiere contraseña y confirmación de texto.
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmText
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña actual del usuario para confirmar la eliminación
 *                 example: "miContrasenaActual123"
 *               confirmText:
 *                 type: string
 *                 description: Debe escribir exactamente "ELIMINAR" para confirmar
 *                 example: "ELIMINAR"
 *     responses:
 *       204:
 *         description: Cuenta eliminada exitosamente (sin contenido)
 *       400:
 *         description: Errores de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               camposFaltantes:
 *                 summary: Campos requeridos faltantes
 *                 value:
 *                   success: false
 *                   message: "Contraseña y confirmación son requeridas"
 *               textoIncorrecto:
 *                 summary: Texto de confirmación incorrecto
 *                 value:
 *                   success: false
 *                   message: "Debe escribir 'ELIMINAR' para confirmar"
 *       401:
 *         description: Contraseña incorrecta o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               contrasenaIncorrecta:
 *                 summary: Contraseña incorrecta
 *                 value:
 *                   success: false
 *                   message: "Contraseña incorrecta"
 *               tokenInvalido:
 *                 summary: Token inválido
 *                 value:
 *                   success: false
 *                   message: "Token inválido"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/me", (req, res) => UserController.deleteAccount(req, res));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios (Solo administradores)
 *     tags: [Usuarios - Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", UserController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID (Solo administradores)
 *     tags: [Usuarios - Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", UserController.read);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear nuevo usuario (Solo administradores)
 *     tags: [Usuarios - Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Errores de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", UserController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario por ID (Solo administradores)
 *     tags: [Usuarios - Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombres:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Juan Carlos"
 *               apellidos:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Pérez García"
 *               edad:
 *                 type: integer
 *                 minimum: 13
 *                 maximum: 120
 *                 example: 26
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@email.com"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Errores de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ya registrado por otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", UserController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario por ID (Solo administradores)
 *     tags: [Usuarios - Administración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       204:
 *         description: Usuario eliminado exitosamente (sin contenido)
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", UserController.delete);

module.exports = router;
