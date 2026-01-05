import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter?: nodemailer.Transporter;
  private resend?: Resend;

  constructor() {
    if (config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
      });
    }

    if (config.email.resendApiKey) {
      this.resend = new Resend(config.email.resendApiKey);
    }

    if (!this.transporter && !this.resend) {
      logger.warn('Email service not configured - missing SMTP or Resend credentials');
    }
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
  }): Promise<void> {
    const fromAddress = config.email.resendFrom || config.email.from;
    if (!fromAddress) {
      throw new Error('FROM_EMAIL or RESEND_FROM_EMAIL is required');
    }

    if (this.resend) {
      const resendAttachments = options.attachments?.map((attachment) => {
        const item: { filename: string; content: string; content_type?: string } = {
          filename: attachment.filename,
          content: attachment.content.toString('base64')
        };
        if (attachment.contentType) {
          item.content_type = attachment.contentType;
        }
        return item;
      });

      const payload: Parameters<Resend['emails']['send']>[0] = {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      if (resendAttachments && resendAttachments.length > 0) {
        payload.attachments = resendAttachments;
      }

      await this.resend.emails.send(payload);
      return;
    }

    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    await this.transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  }

  /**
   * Send verification email
   */
  public async sendVerificationEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.sendEmail({
        to: email,
        subject: 'Verifica tu cuenta - SMD Vital',
        html: this.getVerificationEmailTemplate(firstName)
      });
      logger.info('Verification email sent', { email });
    } catch (error: any) {
      logger.error('Failed to send verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${config.cors.origin}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Restablece tu contraseña - SMD Vital',
        html: this.getPasswordResetEmailTemplate(firstName, resetUrl)
      };

      await this.sendEmail({ to: email, subject: mailOptions.subject, html: mailOptions.html });
      logger.info('Password reset email sent', { email });
    } catch (error: any) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send appointment confirmation email
   */
  public async sendAppointmentConfirmation(email: string, firstName: string, appointmentData: any): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Confirmación de cita médica - SMD Vital',
        html: this.getAppointmentConfirmationTemplate(firstName, appointmentData)
      };

      await this.sendEmail({ to: email, subject: mailOptions.subject, html: mailOptions.html });
      logger.info('Appointment confirmation email sent', { email, appointmentId: appointmentData.id });
    } catch (error: any) {
      logger.error('Failed to send appointment confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send appointment reminder email
   */
  public async sendAppointmentReminder(email: string, firstName: string, appointmentData: any): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Recordatorio de cita médica - SMD Vital',
        html: this.getAppointmentReminderTemplate(firstName, appointmentData)
      };

      await this.sendEmail({ to: email, subject: mailOptions.subject, html: mailOptions.html });
      logger.info('Appointment reminder email sent', { email, appointmentId: appointmentData.id });
    } catch (error: any) {
      logger.error('Failed to send appointment reminder email:', error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  public async sendPaymentConfirmation(email: string, firstName: string, paymentData: any): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Confirmación de pago - SMD Vital',
        html: this.getPaymentConfirmationTemplate(firstName, paymentData)
      };

      await this.sendEmail({ to: email, subject: mailOptions.subject, html: mailOptions.html });
      logger.info('Payment confirmation email sent', { email, paymentId: paymentData.id });
    } catch (error: any) {
      logger.error('Failed to send payment confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send clinical documents email
   */
  public async sendClinicalDocuments(
    email: string,
    firstName: string,
    appointmentData: any,
    documents: Array<{ fileName: string; filePath: string }>
  ): Promise<void> {
    try {
      if (!documents.length) {
        throw new Error('Clinical documents are required');
      }

      const basePath = path.resolve(process.cwd(), config.upload.uploadPath);
      const attachments = await Promise.all(
        documents.map(async (document) => {
          const absolutePath = path.resolve(basePath, document.filePath);
          const content = await fs.readFile(absolutePath);
          return {
            filename: document.fileName,
            content,
            contentType: 'application/pdf'
          };
        })
      );

      const appointmentDate = appointmentData?.scheduledAt
        ? new Date(appointmentData.scheduledAt).toLocaleString('es-CO')
        : 'No disponible';
      const serviceName = appointmentData?.service?.name || 'Consulta';
      const doctorName = appointmentData?.doctor?.user
        ? `${appointmentData.doctor.user.firstName} ${appointmentData.doctor.user.lastName}`
        : 'No asignado';

      await this.sendEmail({
        to: email,
        subject: 'Documentos clinicos de tu cita - SMD Vital',
        html: this.getClinicalDocumentsTemplate(firstName, {
          appointmentDate,
          serviceName,
          doctorName
        }),
        attachments
      });

      logger.info('Clinical documents email sent', { email });
    } catch (error: any) {
      logger.error('Failed to send clinical documents email:', error);
      throw error;
    }
  }

  /**
   * Get verification email template
   */
  private getVerificationEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verifica tu cuenta - SMD Vital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2c5aa0; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMD Vital</h1>
            <p>Médico a Domicilio en Bogotá</p>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Gracias por registrarte en SMD Vital. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.</p>
            <p>Tu cuenta ha sido creada exitosamente y ya puedes comenzar a usar nuestros servicios.</p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Bienvenido a SMD Vital!</p>
          </div>
          <div class="footer">
            <p>SMD Vital - Atención médica profesional a domicilio en Bogotá</p>
            <p>© 2024 SMD Vital. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Restablece tu contraseña - SMD Vital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2c5aa0; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMD Vital</h1>
            <p>Médico a Domicilio en Bogotá</p>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </p>
            <p>Este enlace expirará en 1 hora por seguridad.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>SMD Vital - Atención médica profesional a domicilio en Bogotá</p>
            <p>© 2024 SMD Vital. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get appointment confirmation email template
   */
  private getAppointmentConfirmationTemplate(firstName: string, appointmentData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de cita médica - SMD Vital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMD Vital</h1>
            <p>Médico a Domicilio en Bogotá</p>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Tu cita médica ha sido confirmada exitosamente.</p>
            <div class="appointment-details">
              <h3>Detalles de la cita:</h3>
              <p><strong>Fecha y hora:</strong> ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')}</p>
              <p><strong>Servicio:</strong> ${appointmentData.service?.name || 'Consulta médica'}</p>
              <p><strong>Doctor:</strong> ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}</p>
              <p><strong>Especialidad:</strong> ${appointmentData.doctor?.specialty}</p>
              <p><strong>Dirección:</strong> ${appointmentData.address}, ${appointmentData.city}</p>
              <p><strong>Precio:</strong> $${appointmentData.totalPrice?.toLocaleString('es-CO')} COP</p>
            </div>
            <p>Te recordaremos sobre tu cita 24 horas antes.</p>
            <p>Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.</p>
          </div>
          <div class="footer">
            <p>SMD Vital - Atención médica profesional a domicilio en Bogotá</p>
            <p>© 2024 SMD Vital. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get appointment reminder email template
   */
  private getAppointmentReminderTemplate(firstName: string, appointmentData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recordatorio de cita médica - SMD Vital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMD Vital</h1>
            <p>Médico a Domicilio en Bogotá</p>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Te recordamos que tienes una cita médica programada.</p>
            <div class="appointment-details">
              <h3>Detalles de la cita:</h3>
              <p><strong>Fecha y hora:</strong> ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')}</p>
              <p><strong>Servicio:</strong> ${appointmentData.service?.name || 'Consulta médica'}</p>
              <p><strong>Doctor:</strong> ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}</p>
              <p><strong>Especialidad:</strong> ${appointmentData.doctor?.specialty}</p>
              <p><strong>Dirección:</strong> ${appointmentData.address}, ${appointmentData.city}</p>
            </div>
            <p>Por favor, asegúrate de estar disponible en la dirección indicada.</p>
            <p>Si necesitas cancelar o reprogramar, contáctanos inmediatamente.</p>
          </div>
          <div class="footer">
            <p>SMD Vital - Atención médica profesional a domicilio en Bogotá</p>
            <p>© 2024 SMD Vital. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get payment confirmation email template
   */
  private getPaymentConfirmationTemplate(firstName: string, paymentData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de pago - SMD Vital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMD Vital</h1>
            <p>Médico a Domicilio en Bogotá</p>
          </div>
          <div class="content">
            <h2>¡Hola ${firstName}!</h2>
            <p>Tu pago ha sido procesado exitosamente.</p>
            <div class="payment-details">
              <h3>Detalles del pago:</h3>
              <p><strong>ID de transacción:</strong> ${paymentData.transactionId || paymentData.id}</p>
              <p><strong>Monto:</strong> $${paymentData.amount?.toLocaleString('es-CO')} COP</p>
              <p><strong>Método de pago:</strong> ${paymentData.method}</p>
              <p><strong>Fecha:</strong> ${new Date(paymentData.createdAt).toLocaleString('es-CO')}</p>
              <p><strong>Estado:</strong> ${paymentData.status}</p>
            </div>
            <p>Gracias por confiar en SMD Vital para tu atención médica.</p>
          </div>
          <div class="footer">
            <p>SMD Vital - Atención médica profesional a domicilio en Bogotá</p>
            <p>© 2024 SMD Vital. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get clinical documents email template
   */
  private getClinicalDocumentsTemplate(
    firstName: string,
    summary: { appointmentDate: string; serviceName: string; doctorName: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Documentos clinicos - SMD Vital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMD Vital</h1>
            <p>Medico a Domicilio en Bogota</p>
          </div>
          <div class="content">
            <h2>Hola ${firstName}!</h2>
            <p>Adjuntamos la historia clinica y la formula medica de tu cita.</p>
            <div class="appointment-details">
              <h3>Detalles de la cita:</h3>
              <p><strong>Fecha y hora:</strong> ${summary.appointmentDate}</p>
              <p><strong>Servicio:</strong> ${summary.serviceName}</p>
              <p><strong>Doctor:</strong> ${summary.doctorName}</p>
            </div>
            <p>Si necesitas aclaraciones o seguimiento, responde a este correo.</p>
          </div>
          <div class="footer">
            <p>SMD Vital - Atencion medica profesional a domicilio en Bogota</p>
            <p>2024 SMD Vital. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

