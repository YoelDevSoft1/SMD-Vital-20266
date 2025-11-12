import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  REDIS_URL: z.string().min(1, 'Redis URL is required'),

  // JWT
  JWT_SECRET: z.string().min(1, 'JWT secret is required'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT refresh secret is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Server
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'), 

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Payment (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  SESSION_SECRET: z.string().min(1, 'Session secret is required'),

  // External APIs
  LAB_API_URL: z.string().optional(),
  HOSPITAL_API_URL: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  PROMETHEUS_PORT: z.string().transform(Number).default('9090'),
});

// Validate environment variables with defaults for development
const env = envSchema.parse({
  DATABASE_URL: process.env['DATABASE_URL'] || "postgresql://username:password@localhost:5432/smd_vital_db",
  REDIS_URL: process.env['REDIS_URL'] || "redis://localhost:6379",
  JWT_SECRET: process.env['JWT_SECRET'] || "dev-jwt-secret-key-that-is-at-least-32-characters-long-for-development",
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || "24h",
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || "dev-refresh-secret-key-that-is-at-least-32-characters-long-for-development",
  JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || "7d",
  PORT: process.env['PORT'] || "3000",
  NODE_ENV: process.env['NODE_ENV'] || "development",
  API_VERSION: process.env['API_VERSION'] || "v1",
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || "http://localhost:5173,http://localhost:5174",
  CORS_CREDENTIALS: process.env['CORS_CREDENTIALS'] || "true",
  RATE_LIMIT_WINDOW_MS: process.env['RATE_LIMIT_WINDOW_MS'] || "900000",
  RATE_LIMIT_MAX_REQUESTS: process.env['RATE_LIMIT_MAX_REQUESTS'] || "100",
  MAX_FILE_SIZE: process.env['MAX_FILE_SIZE'] || "10485760",
  UPLOAD_PATH: process.env['UPLOAD_PATH'] || "./uploads",
  BCRYPT_ROUNDS: process.env['BCRYPT_ROUNDS'] || "12",
  SESSION_SECRET: process.env['SESSION_SECRET'] || "dev-session-secret-that-is-at-least-32-characters-long-for-development",
  LOG_LEVEL: process.env['LOG_LEVEL'] || "info",
  LOG_FILE: process.env['LOG_FILE'] || "logs/app.log",
  SENTRY_DSN: process.env['SENTRY_DSN'] || undefined,
  ...process.env
});

// Configuration object
export const config = {
  // Server configuration
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  apiVersion: env.API_VERSION,

  // Database configuration
  database: {
    url: env.DATABASE_URL,
  },

  // Redis configuration
  redis: {
    url: env.REDIS_URL,
  },

  // JWT configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // CORS configuration
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // File upload configuration
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    uploadPath: env.UPLOAD_PATH,
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },

  // Email configuration
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    from: env.FROM_EMAIL,
  },

  // SMS configuration (Twilio)
  sms: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },

  // Payment configuration (Stripe)
  payment: {
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  // Google Maps configuration
  maps: {
    apiKey: env.GOOGLE_MAPS_API_KEY,
  },

  // Logging configuration
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },

  // Security configuration
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
  },

  // External APIs
  externalApis: {
    lab: env.LAB_API_URL,
    hospital: env.HOSPITAL_API_URL,
  },

  // Monitoring configuration
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    prometheusPort: env.PROMETHEUS_PORT,
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

// Type definitions for better TypeScript support
export type Config = typeof config;
export type DatabaseConfig = typeof config.database;
export type JWTConfig = typeof config.jwt;
export type CORSConfig = typeof config.cors;
export type RateLimitConfig = typeof config.rateLimit;
export type UploadConfig = typeof config.upload;
export type CloudinaryConfig = typeof config.cloudinary;
export type EmailConfig = typeof config.email;
export type SMSConfig = typeof config.sms;
export type PaymentConfig = typeof config.payment;
export type MapsConfig = typeof config.maps;
export type LoggingConfig = typeof config.logging;
export type SecurityConfig = typeof config.security;
export type ExternalApisConfig = typeof config.externalApis;
export type MonitoringConfig = typeof config.monitoring;
export type BusinessConfig = typeof config.business;
