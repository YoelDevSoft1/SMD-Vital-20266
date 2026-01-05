import api from './api';
import type { ApiResponse, ClinicalAppointment, PaginatedResponse, PatientHistory } from '@/types';

export interface ClinicalAppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export interface FinishEncounterPayload {
  encounterSummary?: string;
  encounterPayload?: Record<string, unknown>;
  medicalRecord: {
    title: string;
    description: string;
    type?: string;
    payload?: Record<string, unknown>;
    doctorNotes?: string;
    templateVersion?: string;
  };
  prescription?: {
    notes?: string;
    templateVersion?: string;
    items: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  };
}

export interface VitalSignInput {
  bpSys?: number;
  bpDia?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface CreateRecordByEmailPayload {
  patientEmail: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  serviceName?: string;
  sendEmail?: boolean;
  vitals?: {
    bpSys?: number;
    bpDia?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    spo2?: number;
    weight?: number;
    height?: number;
  };
  medicalRecord: {
    title: string;
    description: string;
    type?: string;
    payload?: Record<string, unknown>;
    doctorNotes?: string;
    templateVersion?: string;
  };
  prescription?: {
    notes?: string;
    templateVersion?: string;
    items: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
  };
}

export const clinicalService = {
  getAssignedAppointments: (filters: ClinicalAppointmentFilters) =>
    api.get<ApiResponse<PaginatedResponse<ClinicalAppointment>>>('/clinical/appointments', {
      params: filters,
    }),

  getAppointmentDetails: (id: string) =>
    api.get<ApiResponse<ClinicalAppointment>>(`/clinical/appointments/${id}`),

  startEncounter: (appointmentId: string) =>
    api.post<ApiResponse<any>>(`/clinical/appointments/${appointmentId}/start`),

  recordVitals: (encounterId: string, payload: VitalSignInput) =>
    api.post<ApiResponse<any>>(`/clinical/encounters/${encounterId}/vitals`, payload),

  finishEncounter: (appointmentId: string, payload: FinishEncounterPayload) =>
    api.post<ApiResponse<any>>(`/clinical/appointments/${appointmentId}/finish`, payload),

  addEncounterNotes: (encounterId: string, payload: { summary?: string; payload?: Record<string, unknown> }) =>
    api.post<ApiResponse<any>>(`/clinical/encounters/${encounterId}/notes`, payload),

  createRecordByEmail: (payload: CreateRecordByEmailPayload) =>
    api.post<ApiResponse<any>>('/clinical/records/by-email', payload),

  getPatientHistory: () =>
    api.get<ApiResponse<PatientHistory>>('/clinical/patient/history'),

  downloadMedicalRecord: (recordId: string) =>
    api.get(`/clinical/records/${recordId}/document`, { responseType: 'blob' }),

  downloadPrescription: (prescriptionId: string) =>
    api.get(`/clinical/prescriptions/${prescriptionId}/document`, { responseType: 'blob' }),
};
