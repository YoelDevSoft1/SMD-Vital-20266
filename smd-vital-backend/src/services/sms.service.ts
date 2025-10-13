import twilio from 'twilio';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class SMSService {
  private client: twilio.Twilio | undefined;

  constructor() {
    if (config.sms.accountSid && config.sms.authToken) {
      this.client = twilio(config.sms.accountSid, config.sms.authToken);
    } else {
      logger.warn('SMS service not configured - missing Twilio credentials');
    }
  }

  /**
   * Send SMS message
   */
  public async sendSMS(to: string, message: string): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      const result = await this.client.messages.create({
        body: message,
        from: config.sms.phoneNumber || '',
        to: to
      });

      logger.info('SMS sent successfully', {
        to,
        messageId: result.sid,
        status: result.status
      });
    } catch (error: any) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  public async sendAppointmentConfirmationSMS(
    phoneNumber: string,
    _patientName: string,
    appointmentData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, tu cita médica ha sido confirmada para el ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')} con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}. Dirección: ${appointmentData.address}, ${appointmentData.city}. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send appointment reminder SMS
   */
  public async sendAppointmentReminderSMS(
    phoneNumber: string,
    _patientName: string,
    appointmentData: any
  ): Promise<void> {
    const message = `Recordatorio: Tienes una cita médica mañana a las ${new Date(appointmentData.scheduledAt).toLocaleTimeString('es-CO')} con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment confirmation SMS
   */
  public async sendPaymentConfirmationSMS(
    phoneNumber: string,
    _patientName: string,
    _paymentData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, tu pago de $${_paymentData.amount?.toLocaleString('es-CO')} COP ha sido procesado exitosamente. ID de transacción: ${_paymentData.transactionId || _paymentData.id}. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send verification code SMS
   */
  public async sendVerificationCodeSMS(
    phoneNumber: string,
    code: string
  ): Promise<void> {
    const message = `Tu código de verificación SMD Vital es: ${code}. Este código expira en 10 minutos.`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send password reset SMS
   */
  public async sendPasswordResetSMS(
    phoneNumber: string,
    _patientName: string,
    resetCode: string
  ): Promise<void> {
    const message = `Hola ${_patientName}, tu código para restablecer la contraseña es: ${resetCode}. Este código expira en 1 hora. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send emergency contact SMS
   */
  public async sendEmergencyContactSMS(
    phoneNumber: string,
    _patientName: string,
    emergencyData: any
  ): Promise<void> {
    const message = `EMERGENCIA: ${_patientName} necesita atención médica urgente. Ubicación: ${emergencyData.address}, ${emergencyData.city}. Contacto: ${emergencyData.contactPhone}. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send appointment cancellation SMS
   */
  public async sendAppointmentCancellationSMS(
    phoneNumber: string,
    _patientName: string,
    appointmentData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, tu cita médica del ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')} ha sido cancelada. Si necesitas reprogramar, contáctanos. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send appointment rescheduling SMS
   */
  public async sendAppointmentReschedulingSMS(
    phoneNumber: string,
    _patientName: string,
    appointmentData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, tu cita médica ha sido reprogramada para el ${new Date(appointmentData.scheduledAt).toLocaleString('es-CO')} con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send doctor assignment SMS
   */
  public async sendDoctorAssignmentSMS(
    phoneNumber: string,
    _patientName: string,
    doctorData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, el Dr. ${doctorData.user?.firstName} ${doctorData.user?.lastName} (${doctorData.specialty}) ha sido asignado a tu cita. Te contactará pronto. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send service completion SMS
   */
  public async sendServiceCompletionSMS(
    phoneNumber: string,
    _patientName: string,
    _serviceData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, tu servicio médico ha sido completado. Gracias por confiar en SMD Vital. Si necesitas seguimiento, contáctanos.`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send feedback request SMS
   */
  public async sendFeedbackRequestSMS(
    phoneNumber: string,
    _patientName: string,
    appointmentData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, ¿cómo fue tu experiencia con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}? Tu opinión es importante para nosotros. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send promotional SMS
   */
  public async sendPromotionalSMS(
    phoneNumber: string,
    _patientName: string,
    promotionData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, ${promotionData.message} SMD Vital - Atención médica profesional a domicilio en Bogotá.`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send system maintenance SMS
   */
  public async sendSystemMaintenanceSMS(
    phoneNumber: string,
    _patientName: string,
    maintenanceData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, informamos que nuestro sistema estará en mantenimiento el ${maintenanceData.date} de ${maintenanceData.startTime} a ${maintenanceData.endTime}. Disculpa las molestias. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send appointment follow-up SMS
   */
  public async sendAppointmentFollowUpSMS(
    phoneNumber: string,
    _patientName: string,
    appointmentData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, esperamos que te sientas mejor después de tu cita con el Dr. ${appointmentData.doctor?.user?.firstName} ${appointmentData.doctor?.user?.lastName}. Si necesitas seguimiento, contáctanos. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send insurance verification SMS
   */
  public async sendInsuranceVerificationSMS(
    phoneNumber: string,
    _patientName: string,
    insuranceData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, necesitamos verificar tu información de seguro (${insuranceData.provider}). Por favor, contáctanos para completar el proceso. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send lab results SMS
   */
  public async sendLabResultsSMS(
    phoneNumber: string,
    _patientName: string,
    _labData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, tus resultados de laboratorio están listos. Por favor, contáctanos para revisarlos con un médico. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send prescription reminder SMS
   */
  public async sendPrescriptionReminderSMS(
    phoneNumber: string,
    _patientName: string,
    prescriptionData: any
  ): Promise<void> {
    const message = `Hola ${_patientName}, recuerda tomar tu medicamento: ${prescriptionData.medication} ${prescriptionData.dosage} ${prescriptionData.frequency}. SMD Vital`;

    await this.sendSMS(phoneNumber, message);
  }

}

