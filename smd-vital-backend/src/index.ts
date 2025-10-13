import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import configurations
import { config } from './config/simple';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

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

class SMDVitalServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private prisma: PrismaClient;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: config.cors.credentials
      }
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeServices();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

    // API documentation
    this.app.get('/api/docs', (_req, res) => {
      res.json({
        message: 'SMD Vital API Documentation',
        version: '1.0.0',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          patients: '/api/v1/patients',
          doctors: '/api/v1/doctors',
          appointments: '/api/v1/appointments',
          services: '/api/v1/services',
          payments: '/api/v1/payments',
          reviews: '/api/v1/reviews',
          notifications: '/api/v1/notifications',
          admin: '/api/v1/admin'
        }
      });
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

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.prisma.$connect();
      logger.info('Database connected successfully');

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 SMD Vital Backend running on port ${config.port}`);
        logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
        logger.info(`🏥 Health Check: http://localhost:${config.port}/health`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
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
