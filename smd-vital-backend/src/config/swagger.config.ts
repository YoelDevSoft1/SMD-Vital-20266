import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SMD Vital API',
      version: '1.0.0',
      description: 'API completa para SMD Vital - Servicios médicos a domicilio en Bogotá',
      contact: {
        name: 'SMD Vital Support',
        email: 'soporte@smdvitalbogota.com',
        url: 'https://smdvitalbogota.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.smdvitalbogota.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido del endpoint de autenticación'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Error details'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            requestId: {
              type: 'string',
              example: 'unique-request-id'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            requestId: {
              type: 'string',
              example: 'unique-request-id'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@example.com'
            },
            firstName: {
              type: 'string',
              example: 'Juan'
            },
            lastName: {
              type: 'string',
              example: 'Pérez'
            },
            phone: {
              type: 'string',
              example: '+573001234567'
            },
            role: {
              type: 'string',
              enum: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN'],
              example: 'PATIENT'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            avatar: {
              type: 'string',
              format: 'uri',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890'
            },
            patientId: {
              type: 'string',
              example: 'clx1234567890'
            },
            doctorId: {
              type: 'string',
              example: 'clx1234567890'
            },
            serviceId: {
              type: 'string',
              example: 'clx1234567890'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
              example: 'PENDING'
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time'
            },
            duration: {
              type: 'number',
              example: 60
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              example: 150000
            },
            address: {
              type: 'string',
              example: 'Calle 123 #45-67'
            },
            city: {
              type: 'string',
              example: 'Bogotá'
            }
          }
        },
        Doctor: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890'
            },
            licenseNumber: {
              type: 'string',
              example: 'COL123456'
            },
            specialty: {
              type: 'string',
              example: 'Medicina General'
            },
            experience: {
              type: 'number',
              example: 5
            },
            rating: {
              type: 'number',
              format: 'float',
              example: 4.8
            },
            totalReviews: {
              type: 'number',
              example: 127
            },
            isAvailable: {
              type: 'boolean',
              example: true
            },
            consultationFee: {
              type: 'number',
              format: 'float',
              example: 150000
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890'
            },
            name: {
              type: 'string',
              example: 'Consulta Médica Domiciliaria'
            },
            description: {
              type: 'string',
              example: 'Atención médica en la comodidad de tu hogar'
            },
            category: {
              type: 'string',
              enum: ['CONSULTATION', 'EMERGENCY', 'LABORATORY', 'NURSING', 'SPECIALIST', 'THERAPY', 'VACCINATION', 'OTHER'],
              example: 'CONSULTATION'
            },
            basePrice: {
              type: 'number',
              format: 'float',
              example: 150000
            },
            duration: {
              type: 'number',
              example: 60
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Data retrieved successfully'
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  example: 1
                },
                limit: {
                  type: 'number',
                  example: 20
                },
                total: {
                  type: 'number',
                  example: 100
                },
                totalPages: {
                  type: 'number',
                  example: 5
                },
                hasNext: {
                  type: 'boolean',
                  example: true
                },
                hasPrev: {
                  type: 'boolean',
                  example: false
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación y autorización'
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios'
      },
      {
        name: 'Patients',
        description: 'Gestión de pacientes'
      },
      {
        name: 'Doctors',
        description: 'Gestión de doctores'
      },
      {
        name: 'Appointments',
        description: 'Gestión de citas médicas'
      },
      {
        name: 'Services',
        description: 'Gestión de servicios médicos'
      },
      {
        name: 'Payments',
        description: 'Gestión de pagos'
      },
      {
        name: 'Reviews',
        description: 'Gestión de reseñas'
      },
      {
        name: 'Notifications',
        description: 'Gestión de notificaciones'
      },
      {
        name: 'Admin',
        description: 'Endpoints administrativos'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

