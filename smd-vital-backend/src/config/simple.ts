// Simple configuration for development
export const config = {
  // Server configuration
  port: parseInt(process.env['PORT'] || '3000'),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  apiVersion: process.env['API_VERSION'] || 'v1',

  // Database configuration
  database: {
    url: process.env['DATABASE_URL'] || 'postgresql://username:password@localhost:5432/smd_vital_db',
  },

  // Redis configuration
  redis: {
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
  },

  // JWT configuration
  jwt: {
    secret: process.env['JWT_SECRET'] || 'dev-jwt-secret-key-that-is-at-least-32-characters-long-for-development',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'dev-refresh-secret-key-that-is-at-least-32-characters-long-for-development',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },

  // CORS configuration
  cors: {
    origin: process.env['CORS_ORIGIN'] || ['http://localhost:5173', 'http://localhost:4321', 'http://localhost:3000'],
    credentials: process.env['CORS_CREDENTIALS'] === 'true',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'),
    uploadPath: process.env['UPLOAD_PATH'] || './uploads',
  },

  // Logging configuration
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || 'logs/app.log',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    sessionSecret: process.env['SESSION_SECRET'] || 'dev-session-secret-that-is-at-least-32-characters-long-for-development',
  },

  // Business logic configuration
  business: {
    // Appointment settings
    appointment: {
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      defaultDurationMinutes: 60,
      cancellationWindowHours: 24,
    },

    // Payment settings
    payment: {
      currency: 'COP',
      taxRate: 0.19, // 19% IVA
      processingFeeRate: 0.035, // 3.5% processing fee
    },

    // Notification settings
    notification: {
      appointmentReminderHours: [24, 2], // 24 hours and 2 hours before
      maxRetries: 3,
      retryDelayMinutes: 5,
    },

    // Rating settings
    rating: {
      minRating: 1,
      maxRating: 5,
      requireAppointment: true,
    },

    // File upload settings
    fileUpload: {
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxImageSize: 5 * 1024 * 1024, // 5MB
      maxDocumentSize: 10 * 1024 * 1024, // 10MB
    },
  },
};

