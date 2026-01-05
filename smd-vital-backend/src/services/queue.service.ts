import Bull from 'bull';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { NotificationService } from './notification.service';

export class QueueService {
  private static emailQueue: Bull.Queue;
  private static smsQueue: Bull.Queue;
  private static notificationQueue: Bull.Queue;
  private static appointmentQueue: Bull.Queue;
  private static paymentQueue: Bull.Queue;

  /**
   * Initialize all queues
   */
  public static async initialize(): Promise<void> {
    try {
      // Initialize email queue
      this.emailQueue = new Bull('email', config.redis.url, {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Initialize SMS queue
      this.smsQueue = new Bull('sms', config.redis.url, {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Initialize notification queue
      this.notificationQueue = new Bull('notification', config.redis.url, {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Initialize appointment queue
      this.appointmentQueue = new Bull('appointment', config.redis.url, {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Initialize payment queue
      this.paymentQueue = new Bull('payment', config.redis.url, {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Set up queue processors
      await this.setupProcessors();

      logger.info('All queues initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize queues:', error);
      throw error;
    }
  }

  /**
   * Set up queue processors
   */
  private static async setupProcessors(): Promise<void> {
    // Email queue processor
    this.emailQueue.process('send-email', async (job) => {
      const { to, template, data } = job.data;
      const emailService = new EmailService();
      
      try {
        switch (template) {
          case 'verification':
            await emailService.sendVerificationEmail(to, data.firstName);
            break;
          case 'password-reset':
            await emailService.sendPasswordResetEmail(to, data.firstName, data.resetToken);
            break;
          case 'appointment-confirmation':
            await emailService.sendAppointmentConfirmation(to, data.firstName, data.appointment);
            break;
          case 'appointment-reminder':
            await emailService.sendAppointmentReminder(to, data.firstName, data.appointment);
            break;
          case 'payment-confirmation':
            await emailService.sendPaymentConfirmation(to, data.firstName, data.payment);
            break;
          case 'clinical-documents':
            await emailService.sendClinicalDocuments(to, data.firstName, data.appointment, data.documents);
            break;
          default:
            throw new Error(`Unknown email template: ${template}`);
        }
        
        logger.info('Email sent successfully', { to, template, jobId: job.id });
      } catch (error: any) {
        logger.error('Email processing failed:', error);
        throw error;
      }
    });

    // SMS queue processor
    this.smsQueue.process('send-sms', async (job) => {
      const { to, message } = job.data;
      const smsService = new SMSService();
      
      try {
        await smsService.sendSMS(to, message);
        logger.info('SMS sent successfully', { to, jobId: job.id });
      } catch (error: any) {
        logger.error('SMS processing failed:', error);
        throw error;
      }
    });

    // Notification queue processor
    this.notificationQueue.process('send-notification', async (job) => {
      const { userId, title, message, type, data } = job.data;
      const notificationService = new NotificationService();
      
      try {
        await notificationService.createNotification({
          userId,
          title,
          message,
          type,
          data
        });
        logger.info('Notification sent successfully', { userId, type, jobId: job.id });
      } catch (error: any) {
        logger.error('Notification processing failed:', error);
        throw error;
      }
    });

    // Appointment queue processor
    this.appointmentQueue.process('appointment-reminder', async (job) => {
      const { appointmentId, reminderType } = job.data;
      
      try {
        // Process appointment reminder logic
        logger.info('Appointment reminder processed', { appointmentId, reminderType, jobId: job.id });
      } catch (error: any) {
        logger.error('Appointment reminder processing failed:', error);
        throw error;
      }
    });

    // Payment queue processor
    this.paymentQueue.process('process-payment', async (job) => {
      const { paymentId } = job.data;
      
      try {
        // Process payment logic
        logger.info('Payment processed', { paymentId, jobId: job.id });
      } catch (error: any) {
        logger.error('Payment processing failed:', error);
        throw error;
      }
    });

    // Set up queue event listeners
    this.setupQueueEventListeners();
  }

  /**
   * Set up queue event listeners
   */
  private static setupQueueEventListeners(): void {
    // Email queue events
    this.emailQueue.on('completed', (job) => {
      logger.info('Email job completed', { jobId: job.id, jobName: job.name });
    });

    this.emailQueue.on('failed', (job, err) => {
      logger.error('Email job failed', { jobId: job.id, jobName: job.name, error: err.message });
    });

    // SMS queue events
    this.smsQueue.on('completed', (job) => {
      logger.info('SMS job completed', { jobId: job.id, jobName: job.name });
    });

    this.smsQueue.on('failed', (job, err) => {
      logger.error('SMS job failed', { jobId: job.id, jobName: job.name, error: err.message });
    });

    // Notification queue events
    this.notificationQueue.on('completed', (job) => {
      logger.info('Notification job completed', { jobId: job.id, jobName: job.name });
    });

    this.notificationQueue.on('failed', (job, err) => {
      logger.error('Notification job failed', { jobId: job.id, jobName: job.name, error: err.message });
    });

    // Appointment queue events
    this.appointmentQueue.on('completed', (job) => {
      logger.info('Appointment job completed', { jobId: job.id, jobName: job.name });
    });

    this.appointmentQueue.on('failed', (job, err) => {
      logger.error('Appointment job failed', { jobId: job.id, jobName: job.name, error: err.message });
    });

    // Payment queue events
    this.paymentQueue.on('completed', (job) => {
      logger.info('Payment job completed', { jobId: job.id, jobName: job.name });
    });

    this.paymentQueue.on('failed', (job, err) => {
      logger.error('Payment job failed', { jobId: job.id, jobName: job.name, error: err.message });
    });
  }

  /**
   * Add email job to queue
   */
  public static async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    data: any;
  }, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.emailQueue.add('send-email', data, options);
      logger.info('Email job added to queue', { jobId: job.id, to: data.to, template: data.template });
      return job;
    } catch (error: any) {
      logger.error('Failed to add email job:', error);
      throw error;
    }
  }

  /**
   * Add clinical documents email job to queue
   */
  public static async addClinicalDocumentsJob(data: {
    to: string;
    firstName: string;
    appointment: any;
    documents: Array<{ fileName: string; filePath: string }>;
  }, options?: Bull.JobOptions): Promise<Bull.Job> {
    return this.addEmailJob({
      to: data.to,
      subject: 'Documentos clinicos de tu cita - SMD Vital',
      template: 'clinical-documents',
      data: {
        firstName: data.firstName,
        appointment: data.appointment,
        documents: data.documents
      }
    }, options);
  }

  /**
   * Add SMS job to queue
   */
  public static async addSMSJob(data: {
    to: string;
    message: string;
  }, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.smsQueue.add('send-sms', data, options);
      logger.info('SMS job added to queue', { jobId: job.id, to: data.to });
      return job;
    } catch (error: any) {
      logger.error('Failed to add SMS job:', error);
      throw error;
    }
  }

  /**
   * Add notification job to queue
   */
  public static async addNotificationJob(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  }, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.notificationQueue.add('send-notification', data, options);
      logger.info('Notification job added to queue', { jobId: job.id, userId: data.userId, type: data.type });
      return job;
    } catch (error: any) {
      logger.error('Failed to add notification job:', error);
      throw error;
    }
  }

  /**
   * Add appointment job to queue
   */
  public static async addAppointmentJob(data: {
    appointmentId: string;
    reminderType: string;
  }, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.appointmentQueue.add('appointment-reminder', data, options);
      logger.info('Appointment job added to queue', { jobId: job.id, appointmentId: data.appointmentId });
      return job;
    } catch (error: any) {
      logger.error('Failed to add appointment job:', error);
      throw error;
    }
  }

  /**
   * Add payment job to queue
   */
  public static async addPaymentJob(data: {
    paymentId: string;
    paymentData: any;
  }, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.paymentQueue.add('process-payment', data, options);
      logger.info('Payment job added to queue', { jobId: job.id, paymentId: data.paymentId });
      return job;
    } catch (error: any) {
      logger.error('Failed to add payment job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  public static async getQueueStats(): Promise<any> {
    try {
      const stats = {
        email: {
          waiting: await this.emailQueue.getWaiting(),
          active: await this.emailQueue.getActive(),
          completed: await this.emailQueue.getCompleted(),
          failed: await this.emailQueue.getFailed(),
        },
        sms: {
          waiting: await this.smsQueue.getWaiting(),
          active: await this.smsQueue.getActive(),
          completed: await this.smsQueue.getCompleted(),
          failed: await this.smsQueue.getFailed(),
        },
        notification: {
          waiting: await this.notificationQueue.getWaiting(),
          active: await this.notificationQueue.getActive(),
          completed: await this.notificationQueue.getCompleted(),
          failed: await this.notificationQueue.getFailed(),
        },
        appointment: {
          waiting: await this.appointmentQueue.getWaiting(),
          active: await this.appointmentQueue.getActive(),
          completed: await this.appointmentQueue.getCompleted(),
          failed: await this.appointmentQueue.getFailed(),
        },
        payment: {
          waiting: await this.paymentQueue.getWaiting(),
          active: await this.paymentQueue.getActive(),
          completed: await this.paymentQueue.getCompleted(),
          failed: await this.paymentQueue.getFailed(),
        },
      };

      return stats;
    } catch (error: any) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Clean completed jobs
   */
  public static async cleanCompletedJobs(): Promise<void> {
    try {
      await Promise.all([
        this.emailQueue.clean(24 * 60 * 60 * 1000, 'completed'), // 24 hours
        this.smsQueue.clean(24 * 60 * 60 * 1000, 'completed'),
        this.notificationQueue.clean(24 * 60 * 60 * 1000, 'completed'),
        this.appointmentQueue.clean(24 * 60 * 60 * 1000, 'completed'),
        this.paymentQueue.clean(24 * 60 * 60 * 1000, 'completed'),
      ]);

      logger.info('Completed jobs cleaned successfully');
    } catch (error: any) {
      logger.error('Failed to clean completed jobs:', error);
      throw error;
    }
  }

  /**
   * Pause all queues
   */
  public static async pauseAllQueues(): Promise<void> {
    try {
      await Promise.all([
        this.emailQueue.pause(),
        this.smsQueue.pause(),
        this.notificationQueue.pause(),
        this.appointmentQueue.pause(),
        this.paymentQueue.pause(),
      ]);

      logger.info('All queues paused successfully');
    } catch (error: any) {
      logger.error('Failed to pause queues:', error);
      throw error;
    }
  }

  /**
   * Resume all queues
   */
  public static async resumeAllQueues(): Promise<void> {
    try {
      await Promise.all([
        this.emailQueue.resume(),
        this.smsQueue.resume(),
        this.notificationQueue.resume(),
        this.appointmentQueue.resume(),
        this.paymentQueue.resume(),
      ]);

      logger.info('All queues resumed successfully');
    } catch (error: any) {
      logger.error('Failed to resume queues:', error);
      throw error;
    }
  }

  /**
   * Close all queues
   */
  public static async closeAllQueues(): Promise<void> {
    try {
      await Promise.all([
        this.emailQueue.close(),
        this.smsQueue.close(),
        this.notificationQueue.close(),
        this.appointmentQueue.close(),
        this.paymentQueue.close(),
      ]);

      logger.info('All queues closed successfully');
    } catch (error: any) {
      logger.error('Failed to close queues:', error);
      throw error;
    }
  }
}

