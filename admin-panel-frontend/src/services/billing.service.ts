/**
 * billing.service.ts
 *
 * Cliente HTTP para los endpoints del Billing Core:
 *   - /api/v1/appointments/available-slots
 *   - /api/v1/appointments/:id/confirm
 *   - /api/v1/appointments/:id/start
 *   - /api/v1/appointments/:id/complete
 *   - /api/v1/acknowledgements/mine
 *   - /api/v1/acknowledgements/:id/pay
 *   - /api/v1/acknowledgements/:id/acknowledge
 *   - /api/v1/acknowledgements/:id/dispute
 *   - /api/v1/acknowledgements/by-status/:status
 *   - /api/v1/payouts/generate
 *   - /api/v1/payouts
 *   - /api/v1/payouts/:id/approve
 *   - /api/v1/payouts/:id/mark-paid
 */

import api from './api';

export interface AvailableSlot {
  start: string;
  end: string;
  isAvailable?: boolean;
  reason?: string;
}

export interface AppointmentMargin {
  id: string;
  totalPrice: number;
  professionalAmount: number;
  agentAmount: number;
  smdVitalAmount: number;
  professionalId: string | null;
  professionalRole: string | null;
  agentId: string | null;
  appliedRuleId: string;
  appliedRuleSnapshot: any;
  frozenAt: string;
}

export interface Appointment {
  id: string;
  status: string;
  scheduledAt: string;
  totalPrice: number;
  duration: number;
  address: string;
  city: string;
  notes?: string;
  patient?: any;
  doctor?: any;
  service?: { name: string; basePrice: number; requiredRole: string };
  bookedBy?: { firstName: string; lastName: string };
  marginSnapshot?: AppointmentMargin;
  acknowledgements?: Acknowledgement[];
}

export interface Acknowledgement {
  id: string;
  appointmentId: string;
  recipientId: string;
  recipientRole: string;
  amount: number;
  concept: string;
  status: 'PENDING' | 'PAID' | 'ACKNOWLEDGED' | 'DISPUTED' | 'CANCELLED';
  paidAt?: string;
  paidById?: string;
  paymentProof?: string;
  acknowledgedAt?: string;
  disputedReason?: string;
  recipient?: { firstName: string; lastName: string; role: string };
  appointment?: Appointment;
}

export interface PayoutBatch {
  id: string;
  recipientId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
  reference?: string;
  paidAt?: string;
  recipient?: { firstName: string; lastName: string; role: string };
  items?: Array<{ id: string; acknowledgement: Acknowledgement }>;
}

export interface BookingOptions {
  doctors: any[];
  services: any[];
  patients: any[];
}

export const billingService = {
  // Appointments
  async getBookingOptions() {
    const res = await api.get<{ success: boolean; data: BookingOptions }>(
      '/appointments/booking-options'
    );
    return res.data;
  },

  async createQuickPatient(payload: {
    firstName: string;
    lastName: string;
    documentId: string;
    phone?: string;
  }) {
    const res = await api.post<{ success: boolean; data: any }>(
      '/appointments/patients/quick',
      payload
    );
    return res.data;
  },

  async getAvailableSlots(doctorId: string, serviceId: string, date: string) {
    const res = await api.get<{ success: boolean; slots: AvailableSlot[] }>(
      '/appointments/available-slots',
      { params: { doctorId, serviceId, date } }
    );
    return res.data;
  },

  async createAppointment(payload: {
    patientId: string;
    doctorId: string;
    serviceId: string;
    scheduledAt: string;
    duration?: number;
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    notes?: string;
  }) {
    const res = await api.post<{ success: boolean; appointment: Appointment }>(
      '/appointments',
      payload
    );
    return res.data;
  },

  async confirmAppointment(appointmentId: string) {
    const res = await api.post<{ success: boolean; appointment: Appointment; snapshotId: string }>(
      `/appointments/${appointmentId}/confirm`
    );
    return res.data;
  },

  async startAppointment(appointmentId: string) {
    const res = await api.post<{ success: boolean; appointment: Appointment }>(
      `/appointments/${appointmentId}/start`
    );
    return res.data;
  },

  async completeAppointment(appointmentId: string, payload: { diagnosis?: string; prescription?: string; notes?: string }) {
    const res = await api.post<{ success: boolean; appointment: Appointment; acknowledgements: any }>(
      `/appointments/${appointmentId}/complete`,
      payload
    );
    return res.data;
  },

  async getMyAppointments(params?: { status?: string; dateFrom?: string; dateTo?: string }) {
    const res = await api.get<{ success: boolean; count: number; appointments: Appointment[] }>(
      '/appointments/mine',
      { params }
    );
    return res.data;
  },

  // Acknowledgements
  async getMyAcknowledgements(params?: { status?: string }) {
    const res = await api.get<{
      success: boolean;
      count: number;
      totals: Record<string, number>;
      acknowledgements: Acknowledgement[];
    }>('/acknowledgements/mine', { params });
    return res.data;
  },

  async getAcknowledgementsByStatus(
    status: 'PENDING' | 'PAID' | 'ACKNOWLEDGED' | 'DISPUTED' | 'CANCELLED',
    params?: { from?: string; to?: string }
  ) {
    const res = await api.get<{
      success: boolean;
      status: string;
      count: number;
      total: number;
      acknowledgements: Acknowledgement[];
    }>(`/acknowledgements/by-status/${status}`, { params });
    return res.data;
  },

  async payAcknowledgement(ackId: string, payload: { paymentProof?: string; reference?: string }) {
    const res = await api.post<{ success: boolean; acknowledgement: Acknowledgement }>(
      `/acknowledgements/${ackId}/pay`,
      payload
    );
    return res.data;
  },

  async acknowledgeReceipt(ackId: string) {
    const res = await api.post<{ success: boolean; acknowledgement: Acknowledgement }>(
      `/acknowledgements/${ackId}/acknowledge`
    );
    return res.data;
  },

  async disputeAcknowledgement(ackId: string, reason: string) {
    const res = await api.post<{ success: boolean; acknowledgement: Acknowledgement }>(
      `/acknowledgements/${ackId}/dispute`,
      { reason }
    );
    return res.data;
  },

  // Payouts
  async generatePayoutBatch(payload: { periodStart: string; periodEnd: string; recipientIds?: string[] }) {
    const res = await api.post<{
      success: boolean;
      batchesCreated: number;
      totalAmount: number;
      batches: PayoutBatch[];
    }>('/payouts/generate', payload);
    return res.data;
  },

  async getPayoutBatches(params?: { status?: string }) {
    const res = await api.get<{ success: boolean; count: number; batches: PayoutBatch[] }>(
      '/payouts',
      { params }
    );
    return res.data;
  },

  async getPayoutBatch(id: string) {
    const res = await api.get<{ success: boolean; batch: PayoutBatch }>(`/payouts/${id}`);
    return res.data;
  },

  async approvePayoutBatch(id: string) {
    const res = await api.post<{ success: boolean; batch: PayoutBatch }>(`/payouts/${id}/approve`);
    return res.data;
  },

  async markPayoutBatchPaid(id: string, payload: { reference: string; notes?: string }) {
    const res = await api.post<{ success: boolean; batch: PayoutBatch }>(
      `/payouts/${id}/mark-paid`,
      payload
    );
    return res.data;
  },
};

export default billingService;
