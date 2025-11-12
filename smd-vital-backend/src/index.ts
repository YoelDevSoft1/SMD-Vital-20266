import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

// Import configurations
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import prismaClient from './utils/prisma';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import serviceRoutes from './routes/service.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import adminPanelRoutes from './routes/admin-panel.routes';

// Import services
import { SocketService } from './services/socket.service';
import { RedisService } from './services/redis.service';
import { QueueService } from './services/queue.service';
import { MetricsService } from './services/metrics.service';

// Import middleware
import { metricsMiddleware } from './middleware/metrics.middleware';
import { securityMiddleware } from './middleware/sanitize.middleware';

class SMDVitalServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private prisma = prismaClient;
  private metricsService = MetricsService.getInstance();

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    // Parse CORS origins for Socket.IO
    const socketOrigins = typeof config.cors.origin === 'string' 
      ? config.cors.origin.split(',').map(origin => origin.trim())
      : config.cors.origin;
    
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: socketOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: config.cors.credentials
      }
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
          scriptSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
          connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
        },
      },
    }));

    // CORS configuration
    // Parse CORS_ORIGIN - puede ser string simple o múltiples orígenes separados por coma
    const corsOrigins = typeof config.cors.origin === 'string' 
      ? config.cors.origin.split(',').map(origin => origin.trim())
      : config.cors.origin;
    
    this.app.use(cors({
      origin: (origin, callback) => {
        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Si es un array, verificar si el origin está en la lista
        if (Array.isArray(corsOrigins)) {
          if (corsOrigins.includes(origin)) {
            return callback(null, true);
          }
        } else if (corsOrigins === '*' || corsOrigins === origin) {
          return callback(null, true);
        }
        
        // Si no coincide, denegar
        callback(new Error('Not allowed by CORS'));
      },
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
    }));

    // Serve static files
    this.app.use(express.static('public'));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middleware (sanitization, XSS prevention, NoSQL injection prevention)
    this.app.use(securityMiddleware);

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = require('uuid').v4();
      res.setHeader('X-Request-ID', req.id!);
      next();
    });

    // Metrics middleware
    this.app.use(metricsMiddleware);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: process.env['npm_package_version'] || '1.0.0'
      });
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', async (_req, res) => {
      try {
        const metrics = await this.metricsService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.status(200).send(metrics);
      } catch (error) {
        logger.error('Error getting metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/patients', patientRoutes);
    this.app.use('/api/v1/doctors', doctorRoutes);
    this.app.use('/api/v1/appointments', appointmentRoutes);
    this.app.use('/api/v1/services', serviceRoutes);
    this.app.use('/api/v1/payments', paymentRoutes);
    this.app.use('/api/v1/reviews', reviewRoutes);
    this.app.use('/api/v1/notifications', notificationRoutes);
    this.app.use('/api/v1/admin', adminRoutes);
    this.app.use('/api/v1/admin-panel', adminPanelRoutes);

    // Swagger API Documentation
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SMD Vital API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
      }
    }));

    // Swagger JSON endpoint
    this.app.get('/api/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize Redis
      await RedisService.initialize();
      logger.info('Redis service initialized');

      // Initialize Queue Service
      await QueueService.initialize();
      logger.info('Queue service initialized');

      // Initialize Socket Service
      new SocketService(this.io);
      logger.info('Socket service initialized');

      // Initialize Metrics Service
      this.metricsService.start();
      logger.info('Metrics service initialized');

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.prisma.$connect();
      logger.info('Database connected successfully');

      // Initialize background services before accepting traffic
      await this.initializeServices();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 SMD Vital Backend running on port ${config.port}`);
        logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
        logger.info(`📄 Swagger JSON: http://localhost:${config.port}/api/docs.json`);
        logger.info(`🏥 Health Check: http://localhost:${config.port}/health`);
        logger.info(`📊 Metrics: http://localhost:${config.port}/metrics`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
        logger.info(`✅ Caché Redis: Habilitado`);
        logger.info(`🛡️ Seguridad: Sanitización activa`);
        logger.info(`⚡ Rate Limiting: Configurado`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
      // Close database connection
      await this.prisma.$disconnect();
      logger.info('Database connection closed');

      // Close Redis connection
      await RedisService.disconnect();
      logger.info('Redis connection closed');

      // Stop metrics service
      this.metricsService.stop();
      logger.info('Metrics service stopped');

      // Close server
      this.server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });

    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new SMDVitalServer();
server.start().catch((error) => {
  logger.error('Failed to start SMD Vital Backend:', error);
  process.exit(1);
});

export default SMDVitalServer;
