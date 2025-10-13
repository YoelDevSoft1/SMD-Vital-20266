import { User, AppointmentStatus } from '@prisma/client';

// Database entity types
export type UserEntity = User;
export type PatientEntity = {
  id: string;
  userId: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  medications: string | null;
  insuranceNumber: string | null;
  insuranceProvider: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DoctorEntity = {
  id: string;
  userId: string;
  licenseNumber: string;
  specialty: string;
  experience: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  consultationFee: number;
  bio: string | null;
  education: string | null;
  certifications: string | null;
  languages: string[];
  serviceAreas: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type AppointmentEntity = {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  status: AppointmentStatus;
  scheduledAt: Date;
  duration: number;
  notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
  totalPrice: number;
  address: string;
  city: string;
  coordinates: any | null;
  createdAt: Date;
  updatedAt: Date;
};

// Database query types
export interface DatabaseQuery {
  where?: any;
  include?: any;
  select?: any;
  orderBy?: any;
  take?: number;
  skip?: number;
}

export interface PaginatedQuery extends DatabaseQuery {
  page: number;
  limit: number;
}

// Database transaction types
export interface DatabaseTransaction {
  user: any;
  patient: any;
  doctor: any;
  appointment: any;
  payment: any;
  review: any;
  notification: any;
}

// Database connection types
export interface DatabaseConnection {
  isConnected: boolean;
  host: string;
  port: number;
  database: string;
  version: string;
}

// Database migration types
export interface Migration {
  id: string;
  checksum: string;
  finished_at: Date | null;
  migration_name: string;
  logs: string | null;
  rolled_back_at: Date | null;
  started_at: Date;
  applied_steps_count: number;
}

// Database seed types
export interface SeedData {
  users: any[];
  patients: any[];
  doctors: any[];
  services: any[];
  appointments: any[];
  payments: any[];
  reviews: any[];
  notifications: any[];
}

