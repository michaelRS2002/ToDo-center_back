# ToDo Center - Backend API

API backend para la aplicación de gestión de tareas ToDo Center. Construido con Node.js, Express.js y MongoDB, implementa autenticación segura con JWT y funcionalidades completas de gestión de usuarios y tareas.

## Índice

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Comandos de Desarrollo](#comandos-de-desarrollo)
- [Arquitectura](#arquitectura)
- [API Endpoints](#api-endpoints)
- [Flujo de Registro (US-1)](#flujo-de-registro-us-1)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Testing](#testing)
- [Variables de Entorno](#variables-de-entorno)
- [Documentación API](#documentación-api)

## Descripción del Proyecto

Este es el backend de la aplicación ToDo Center, que proporciona una API RESTful para la gestión de usuarios y tareas. Implementa funcionalidades de registro, autenticación, gestión de tareas y características de seguridad avanzadas como rate limiting y control de intentos de login.

## 🛠 Tecnologías

- **Node.js** - Entorno de ejecución de JavaScript
- **Express.js** - Framework web para Node.js
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **bcryptjs** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **express-validator** - Validación de datos
- **express-rate-limit** - Rate limiting
- **Jest** - Framework de testing
- **Supertest** - Testing de APIs HTTP
- **Swagger** - Documentación automática de API

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/michaelRS2002/ToDo-center_back.git
   cd ToDo-center_back
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Configurar base de datos**
   - Crear cuenta en MongoDB Atlas
   - Obtener string de conexión
   - Agregar `MONGO_URI` al archivo `.env`

## Comandos de Desarrollo

```bash
# Desarrollo con auto-restart
npm run dev

# Producción
npm start

# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Linting (si está configurado)
npm run lint
```

## Arquitectura

### Estructura del Proyecto
```
api/
├── config/
│   ├── database.js      # Configuración de MongoDB
│   └── swagger.js       # Configuración de Swagger
├── controllers/
│   ├── AuthController.js    # Lógica de autenticación
│   ├── UserController.js    # Gestión de usuarios
│   └── TaskController.js    # Gestión de tareas
├── middleware/
│   ├── auth.js          # Middleware de autenticación
│   ├── users.js         # Middleware de usuarios
│   └── validateRequest.js   # Validación de requests
├── models/
│   ├── User.js          # Esquema de usuario
│   ├── Task.js          # Esquema de tareas
│   ├── BlacklistedToken.js  # Tokens revocados
│   └── LoginAttempt.js  # Control de intentos de login
├── routes/
│   ├── authRoutes.js    # Rutas de autenticación
│   ├── userRoutes.js    # Rutas de usuarios
│   ├── taskRoutes.js    # Rutas de tareas
│   └── passwordResetRoutes.js  # Recuperación de contraseña
├── utils/
│   └── jwt.js           # Utilidades JWT
└── index.js             # Punto de entrada principal
```

### Base de Datos
- **MongoDB Atlas** - Base de datos en la nube
- **Base de datos**: `task-manager`
- **Conexión**: Mongoose ODM
- **Timestamps automáticos**: `createdAt` y `updatedAt` en formato ISO-8601

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil del usuario
- `PUT /api/users/profile` - Actualizar perfil
- `DELETE /api/users/profile` - Eliminar cuenta

### Tareas
- `GET /api/tasks` - Listar tareas del usuario
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

### Recuperación de Contraseña
- `POST /api/password-reset/request` - Solicitar restablecimiento
- `POST /api/password-reset/reset` - Restablecer contraseña

## Flujo de Registro (US-1)

### Criterios de Aceptación Implementados

#### 1. **Visualización del Formulario**
El endpoint `POST /api/auth/register` acepta los siguientes campos obligatorios:
- **nombres**: 2-50 caracteres, texto requerido
- **apellidos**: 2-50 caracteres, texto requerido  
- **edad**: Número entero ≥ 13 años
- **correo**: Formato RFC 5322 válido, único en el sistema
- **contrasena**: ≥ 8 caracteres, debe contener:
  - Al menos 1 mayúscula
  - Al menos 1 minúscula  
  - Al menos 1 número
  - Al menos 1 carácter especial (@$!%*?&#)
- **confirmarContrasena**: Debe coincidir con contraseña

#### 2. **Validación en Tiempo Real**
- Validaciones implementadas con `express-validator`
- Mensajes de error específicos para cada campo
- Validación de confirmación de contraseña
- Verificación de formato de email

#### 3. **Envío Exitoso**
- Respuesta HTTP 201 con el ID del nuevo usuario
- Contraseña hasheada con bcrypt (12 salt rounds mínimo)
- Timestamp `createdAt` automático en formato ISO-8601

```json
// Respuesta exitosa
{
  "success": true,
  "message": "Cuenta creada con éxito",
  "data": {
    "id": "user_id",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "edad": 25,
    "correo": "juan@email.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 4. **Manejo de Errores**
- **409 Conflict**: Email ya registrado
- **400 Bad Request**: Errores de validación
- **500 Internal Server Error**: Errores genéricos del servidor

#### 5. **Persistencia Segura**
- Contraseñas hasheadas con bcrypt (12 salt rounds)
- Timestamps automáticos con Mongoose
- Validaciones a nivel de esquema y controlador

### Ejemplo de Uso

```bash
# Registro exitoso
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Juan",
    "apellidos": "Pérez", 
    "edad": 25,
    "correo": "juan@email.com",
    "contrasena": "MiPassword123!",
    "confirmarContrasena": "MiPassword123!"
  }'
```

## Autenticación y Seguridad

### Características de Seguridad
- **JWT Tokens**: Autenticación stateless
- **Bcrypt**: Hash de contraseñas con 12 salt rounds
- **Rate Limiting**: Control de intentos de login por IP
- **Account Locking**: Bloqueo temporal tras intentos fallidos
- **CORS**: Configurado para requests cross-origin
- **Input Validation**: Validación exhaustiva con express-validator

### Control de Intentos de Login
- Máximo 5 intentos fallidos por cuenta
- Bloqueo temporal de 10 minutos
- Rate limiting por IP
- Registro de intentos para auditoría

### Tokens JWT
- Expiración configurable
- Payload mínimo por seguridad
- Blacklisting para logout

## Testing

### Framework de Testing
- **Jest**: Framework principal
- **Supertest**: Testing de endpoints HTTP
- **Limpieza automática**: Base de datos se limpia entre tests

### Archivos de Test
- `test/api.routes.test.js` - Tests principales de API
- `test/test-us1-register.js` - Tests específicos de registro
- `test/test-us2-login.js` - Tests específicos de login

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage
```

### Casos de Prueba US-1
- ✅ Registro exitoso con datos válidos
- ✅ Validación de email duplicado (409 Conflict)
- ✅ Validación de campos requeridos
- ✅ Validación de formato de contraseña
- ✅ Validación de confirmación de contraseña
- ✅ Validación de edad mínima
- ✅ Manejo de errores del servidor

## Variables de Entorno

```env
# Base de datos
MONGO_URI=mongodbURL

# JWT
JWT_SECRET=jwt_secret
JWT_EXPIRES_IN=2h

# Servidor
PORT=3000
NODE_ENV=development

# Email (para recuperación de contraseña)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

## Documentación API

La documentación completa de la API está disponible via Swagger UI:

- **Desarrollo**: `http://localhost:3000/....`
- **Producción**: `https://tu-dominio.com/....`

### Características de la Documentación
- Generada automáticamente con Swagger
- Ejemplos de requests y responses
- Esquemas de validación
- Testing interactivo desde el navegador

## Despliegue

### Desarrollo Local
```bash
npm run dev
# Servidor en http://localhost:3000
# Documentación en http://localhost:3000/...
```

### Producción
El proyecto está configurado para despliegue en:
- **Backend**: Render, Heroku, o similar
- **Base de datos**: MongoDB Atlas
- **Variables de entorno**: Configurar en la plataforma de despliegue

### Verificación de Despliegue
- ✅ Endpoint raíz responde: `GET /`
- ✅ Documentación accesible: `GET /...`
- ✅ Health check: Base de datos conectada
- ✅ Variables de entorno configuradas

## Licencia

Este proyecto está bajo la Licencia MIT.

## Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Crear Pull Request

**¡Gracias por usar ToDo Center! 🎉**