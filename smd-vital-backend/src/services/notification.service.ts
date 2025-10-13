import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { CreateNotificationRequest, NotificationQueryParams } from '../types';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Create a new notification
   */
  public async createNotification(data: CreateNotificationRequest): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type as any,
          data: data.data || null
        }
      });

      logger.info('Notification created successfully', { notificationId: notification.id, userId: data.userId });

      return notification;
    } catch (error: any) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  public async getUserNotifications(
    userId: string,
    query: NotificationQueryParams = {}
  ): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        isRead,
        type,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true
        }
      });

      logger.info('Notification marked as read', { notificationId, userId });
    } catch (error: any) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      logger.info('All notifications marked as read', { userId });
    } catch (error: any) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      logger.info('Notification deleted', { notificationId, userId });
    } catch (error: any) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  public async deleteAllNotifications(userId: string): Promise<void> {
    try {
      await prisma.notification.deleteMany({
        where: { userId }
      });

      logger.info('All notifications deleted', { userId });
    } catch (error: any) {
      logger.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error: any) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Send appointment reminder notification
   */
  public async sendAppointmentReminder(
    userId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Recordatorio de cita médica',
        message: `Tienes una cita médica programada para el ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')} con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}`,
        type: 'APPOINTMENT_REMINDER',
        data: {
          appointmentId: appointmentData.id,
          scheduledAt: appointmentData.scheduledAt,
          doctorName: `${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}`,
          address: appointmentData.address,
          city: appointmentData.city
        }
      });

      logger.info('Appointment reminder notification sent', { userId, appointmentId: appointmentData.id });
    } catch (error: any) {
      logger.error('Failed to send appointment reminder notification:', error);
      throw error;
    }
  }

  /**
   * Send appointment confirmation notification
   */
  public async sendAppointmentConfirmation(
    userId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Cita médica confirmada',
        message: `Tu cita médica ha sido confirmada para el ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')} con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}`,
        type: 'APPOINTMENT_CONFIRMED',
        data: {
          appointmentId: appointmentData.id,
          scheduledAt: appointmentData.scheduledAt,
          doctorName: `${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}`,
          address: appointmentData.address,
          city: appointmentData.city,
          totalPrice: appointmentData.totalPrice
        }
      });

      logger.info('Appointment confirmation notification sent', { userId, appointmentId: appointmentData.id });
    } catch (error: any) {
      logger.error('Failed to send appointment confirmation notification:', error);
      throw error;
    }
  }

  /**
   * Send appointment cancellation notification
   */
  public async sendAppointmentCancellation(
    userId: string,
    appointmentData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Cita médica cancelada',
        message: `Tu cita médica del ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')} ha sido cancelada`,
        type: 'APPOINTMENT_CANCELLED',
        data: {
          appointmentId: appointmentData.id,
          scheduledAt: appointmentData.scheduledAt,
          reason: appointmentData.cancellationReason
        }
      });

      logger.info('Appointment cancellation notification sent', { userId, appointmentId: appointmentData.id });
    } catch (error: any) {
      logger.error('Failed to send appointment cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Send payment success notification
   */
  public async sendPaymentSuccess(
    userId: string,
    paymentData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Pago procesado exitosamente',
        message: `Tu pago de $${paymentData.amount?.toLocaleString('es-CO')} COP ha sido procesado exitosamente`,
        type: 'PAYMENT_SUCCESS',
        data: {
          paymentId: paymentData.id,
          amount: paymentData.amount,
          method: paymentData.method,
          transactionId: paymentData.transactionId
        }
      });

      logger.info('Payment success notification sent', { userId, paymentId: paymentData.id });
    } catch (error: any) {
      logger.error('Failed to send payment success notification:', error);
      throw error;
    }
  }

  /**
   * Send payment failure notification
   */
  public async sendPaymentFailure(
    userId: string,
    paymentData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Error en el procesamiento del pago',
        message: `Hubo un error al procesar tu pago de $${paymentData.amount?.toLocaleString('es-CO')} COP. Por favor, intenta nuevamente`,
        type: 'PAYMENT_FAILED',
        data: {
          paymentId: paymentData.id,
          amount: paymentData.amount,
          method: paymentData.method,
          error: paymentData.error
        }
      });

      logger.info('Payment failure notification sent', { userId, paymentId: paymentData.id });
    } catch (error: any) {
      logger.error('Failed to send payment failure notification:', error);
      throw error;
    }
  }

  /**
   * Send new message notification
   */
  public async sendNewMessage(
    userId: string,
    messageData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Nuevo mensaje',
        message: `Tienes un nuevo mensaje de ${messageData.senderName}`,
        type: 'NEW_MESSAGE',
        data: {
          messageId: messageData.id,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          content: messageData.content
        }
      });

      logger.info('New message notification sent', { userId, messageId: messageData.id });
    } catch (error: any) {
      logger.error('Failed to send new message notification:', error);
      throw error;
    }
  }

  /**
   * Send system update notification
   */
  public async sendSystemUpdate(
    userId: string,
    updateData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Actualización del sistema',
        message: updateData.message,
        type: 'SYSTEM_UPDATE',
        data: {
          updateType: updateData.type,
          version: updateData.version,
          features: updateData.features
        }
      });

      logger.info('System update notification sent', { userId, updateType: updateData.type });
    } catch (error: any) {
      logger.error('Failed to send system update notification:', error);
      throw error;
    }
  }

  /**
   * Send promotion notification
   */
  public async sendPromotion(
    userId: string,
    promotionData: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        title: 'Oferta especial',
        message: promotionData.message,
        type: 'PROMOTION',
        data: {
          promotionId: promotionData.id,
          discount: promotionData.discount,
          validUntil: promotionData.validUntil,
          code: promotionData.code
        }
      });

      logger.info('Promotion notification sent', { userId, promotionId: promotionData.id });
    } catch (error: any) {
      logger.error('Failed to send promotion notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  public async sendBulkNotifications(
    userIds: string[],
    notificationData: {
      title: string;
      message: string;
      type: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type as any,
        data: notificationData.data || null
      }));

      await prisma.notification.createMany({
        data: notifications
      });

      logger.info('Bulk notifications sent', { count: userIds.length, type: notificationData.type });
    } catch (error: any) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Clean old notifications
   */
  public async cleanOldNotifications(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      logger.info('Old notifications cleaned', { deletedCount: result.count, daysOld });
    } catch (error: any) {
      logger.error('Failed to clean old notifications:', error);
      throw error;
    }
  }
}

