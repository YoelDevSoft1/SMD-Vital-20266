/**
 * Worker process for Bull queues
 * This is the equivalent of Celery workers in Python
 * Processes jobs from Redis queues: email, sms, notifications, appointments, payments
 */

import 'dotenv/config';
import { QueueService } from './services/queue.service';
import { RedisService } from './services/redis.service';
import { logger } from './utils/logger';
import prismaClient from './utils/prisma';

class Worker {
  private static isShuttingDown = false;

  /**
   * Initialize worker
   */
  public static async initialize(): Promise<void> {
    try {
      logger.info('🚀 Starting Bull Queue Worker...');

      // Initialize Redis
      await RedisService.initialize();
      logger.info('✅ Redis service initialized');

      // Initialize Queue Service (this sets up processors)
      await QueueService.initialize();
      logger.info('✅ Queue service initialized - Workers are ready to process jobs');

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ Worker initialized and ready to process jobs');
      logger.info('📋 Listening for jobs in queues: email, sms, notification, appointment, payment');

    } catch (error: any) {
      logger.error('❌ Failed to initialize worker:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private static setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      logger.info(`🛑 Received ${signal}, shutting down gracefully...`);

      try {
        // Close queues
        await QueueService.closeAllQueues();
        logger.info('✅ All queues closed');

        // Close Redis connection
        await RedisService.disconnect();
        logger.info('✅ Redis connection closed');

        // Close Prisma connection
        await prismaClient.$disconnect();
        logger.info('✅ Database connection closed');

        logger.info('✅ Worker shut down gracefully');
        process.exit(0);
      } catch (error: any) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('❌ Unhandled Rejection:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Start worker
Worker.initialize().catch((error) => {
  logger.error('❌ Failed to start worker:', error);
  process.exit(1);
});

// Keep process alive
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, worker will shut down');
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, worker will shut down');
});

