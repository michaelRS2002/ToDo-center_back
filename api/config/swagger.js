const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ToDo Center API',
      version: '1.0.0',
      description: 'API REST para la aplicación ToDo Center - Sistema de gestión de tareas',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@todocenter.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /api/auth/login'
        }
      },
      schemas: {
        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            nombres: {
              type: 'string',
              description: 'Nombres del usuario'
            },
            apellidos: {
              type: 'string',
              description: 'Apellidos del usuario'
            },
            edad: {
              type: 'integer',
              minimum: 13,
              maximum: 120,
              description: 'Edad del usuario'
            },
            correo: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico único'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            firstName: {
              type: 'string',
              description: 'Nombres del usuario'
            },
            lastName: {
              type: 'string',
              description: 'Apellidos del usuario'
            },
            age: {
              type: 'integer',
              minimum: 13,
              maximum: 120,
              description: 'Edad del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['nombres', 'apellidos', 'edad', 'correo', 'contrasena', 'confirmarContrasena'],
          properties: {
            nombres: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Nombres del usuario',
              example: 'Juan Carlos'
            },
            apellidos: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Apellidos del usuario',
              example: 'Pérez García'
            },
            edad: {
              type: 'integer',
              minimum: 13,
              maximum: 120,
              description: 'Edad del usuario',
              example: 25
            },
            correo: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico único',
              example: 'juan.perez@email.com'
            },
            contrasena: {
              type: 'string',
              minLength: 8,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])',
              description: 'Contraseña (mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial)',
              example: 'MiPassword123!'
            },
            confirmarContrasena: {
              type: 'string',
              description: 'Confirmación de contraseña',
              example: 'MiPassword123!'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['correo', 'contrasena'],
          properties: {
            correo: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico',
              example: 'juan.perez@email.com'
            },
            contrasena: {
              type: 'string',
              description: 'Contraseña del usuario',
              example: 'MiPassword123!'
            }
          }
        },
        // Task Schemas
        Task: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único de la tarea',
              example: '60d5ecb8b392a50f84b6a1c4'
            },
            titulo: {
              type: 'string',
              maxLength: 50,
              description: 'Título de la tarea',
              example: 'Reunión con el equipo'
            },
            detalle: {
              type: 'string',
              maxLength: 500,
              description: 'Descripción detallada de la tarea',
              example: 'Revisar el progreso del proyecto y planificar las siguientes tareas'
            },
            fecha: {
              type: 'string',
              format: 'date',
              description: 'Fecha de la tarea (debe ser futura)',
              example: '2025-09-15'
            },
            hora: {
              type: 'string',
              pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Hora de la tarea (formato HH:mm)',
              example: '14:30'
            },
            estado: {
              type: 'string',
              enum: ['Por hacer', 'Haciendo', 'Hecho'],
              description: 'Estado actual de la tarea',
              example: 'Por hacer'
            },
            userId: {
              type: 'string',
              description: 'ID del usuario propietario',
              example: '60d5ecb8b392a50f84b6a1c3'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['titulo', 'fecha', 'hora'],
          properties: {
            titulo: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'Título de la tarea',
              example: 'Reunión con el equipo'
            },
            detalle: {
              type: 'string',
              maxLength: 500,
              description: 'Descripción detallada (opcional)',
              example: 'Revisar el progreso del proyecto y planificar las siguientes tareas'
            },
            fecha: {
              type: 'string',
              format: 'date',
              description: 'Fecha de la tarea (debe ser futura)',
              example: '2025-09-15'
            },
            hora: {
              type: 'string',
              pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Hora en formato HH:mm',
              example: '14:30'
            },
            estado: {
              type: 'string',
              enum: ['Por hacer', 'Haciendo', 'Hecho'],
              default: 'Por hacer',
              description: 'Estado inicial de la tarea',
              example: 'Por hacer'
            }
          }
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            titulo: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'Título de la tarea',
              example: 'Reunión con el equipo - Actualizada'
            },
            detalle: {
              type: 'string',
              maxLength: 500,
              description: 'Descripción detallada',
              example: 'Revisar el progreso del proyecto, planificar las siguientes tareas y asignar responsabilidades'
            },
            fecha: {
              type: 'string',
              format: 'date',
              description: 'Fecha de la tarea',
              example: '2025-09-16'
            },
            hora: {
              type: 'string',
              pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Hora en formato HH:mm',
              example: '15:00'
            },
            estado: {
              type: 'string',
              enum: ['Por hacer', 'Haciendo', 'Hecho'],
              description: 'Estado de la tarea',
              example: 'Haciendo'
            }
          }
        },
        // Password Reset Schemas
        PasswordResetRequest: {
          type: 'object',
          required: ['correo'],
          properties: {
            correo: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
              example: 'juan.perez@email.com'
            }
          }
        },
        PasswordResetConfirm: {
          type: 'object',
          required: ['token', 'nuevaContrasena', 'confirmarContrasena'],
          properties: {
            token: {
              type: 'string',
              minLength: 64,
              maxLength: 64,
              description: 'Token de restablecimiento recibido por email',
              example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
            },
            nuevaContrasena: {
              type: 'string',
              minLength: 8,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])',
              description: 'Nueva contraseña',
              example: 'NuevaPassword123!'
            },
            confirmarContrasena: {
              type: 'string',
              description: 'Confirmación de la nueva contraseña',
              example: 'NuevaPassword123!'
            }
          }
        },
        // Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo',
              example: 'Operación realizada exitosamente'
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Error en la operación'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              },
              description: 'Detalles de errores de validación'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Errores de validación'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  value: { type: 'string' },
                  msg: { type: 'string' },
                  path: { type: 'string' },
                  location: { type: 'string' }
                }
              }
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Inicio de sesión exitoso'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT token para autenticación',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                  $ref: '#/components/schemas/UserProfile'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./api/routes/*.js'], // Archivos que contienen anotaciones OpenAPI
};

const specs = swaggerJSDoc(options);

const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ToDo Center API Documentation',
    swaggerOptions: {
      persistAuthorization: true
    }
  }));
  
  // Endpoint para obtener el JSON de la documentación
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

module.exports = { swaggerSetup, specs };
