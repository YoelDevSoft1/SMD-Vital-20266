// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User types
export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  isPlaceholder?: boolean;
  avatar?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Dashboard types
export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalPayments: number;
    activeUsers: number;
    verifiedDoctors: number;
    totalRevenue: number;
    monthlyRevenue: number;
    averageRating: number;
  };
  appointments: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  growth: {
    appointments: number;
    users: number;
  };
  recentActivity: {
    appointments: Appointment[];
    users: User[];
  };
  topPerformers: {
    doctors: Doctor[];
    services: Service[];
  };
}

// Doctor types
export interface Doctor {
  id: string;
  userId: string;
  licenseNumber: string;
  specialty: string;
  experience: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  consultationFee: number;
  bio?: string;
  user: User;
  _count?: {
    appointments: number;
    reviews: number;
  };
}

// Appointment types
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  emergencyContact: string;
  medicalHistory?: string;
  allergies?: string;
  user: User;
  _count?: {
    appointments: number;
    medicalRecords: number;
    prescriptions: number;
    reviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  status: AppointmentStatus;
  scheduledAt: string;
  duration: number;
  totalPrice: number;
  address: string;
  city: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  patient?: Patient;
  doctor?: Doctor;
  service?: Service;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface VitalSign {
  id: string;
  recordedAt: string;
  bpSys?: number | null;
  bpDia?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  weight?: number | null;
  height?: number | null;
  notes?: string | null;
}

export interface Encounter {
  id: string;
  status: string;
  summary?: string | null;
  finishedAt?: string | null;
  vitals?: VitalSign[];
}

export interface MedicalRecord {
  id: string;
  title: string;
  description: string;
  type?: string | null;
  doctorNotes?: string | null;
  pdfPath?: string | null;
  createdAt: string;
  doctor?: {
    user?: User;
  };
}

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface Prescription {
  id: string;
  notes?: string | null;
  status?: string | null;
  pdfPath?: string | null;
  createdAt: string;
  doctor?: {
    user?: User;
  };
  items?: PrescriptionItem[];
}

export interface ClinicalAppointment extends Appointment {
  assignedNurse?: User | null;
  encounter?: Encounter | null;
}

export interface PatientHistory {
  id: string;
  userId: string;
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  appointments: Appointment[];
}

// Service types
export type ServiceCategory =
  | 'CONSULTATION'
  | 'EMERGENCY'
  | 'LABORATORY'
  | 'NURSING'
  | 'SPECIALIST'
  | 'THERAPY'
  | 'VACCINATION'
  | 'OTHER';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  basePrice: number;
  duration: number;
  isActive: boolean;
  _count?: {
    appointments: number;
    doctorServices: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Payment types
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'NEQUI' | 'DAVIPLATA' | 'PSE';

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  appointment?: Appointment;
  createdAt: string;
  updatedAt: string;
}

// Review types
export interface Review {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  patient: {
    user: User;
  };
  doctor: {
    user: User;
  };
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface AnalyticsData {
  period: {
    start: string;
    end: string;
    groupBy: string;
  };
  trends: Array<{
    date: string;
    appointments: number;
    revenue: number;
    users: number;
  }>;
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalUsers: number;
    averageOrderValue: number;
  };
}

export type AnalyticsMetric = 'appointments' | 'revenue' | 'users';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  metric?: AnalyticsMetric;
  compareTo?: 'previous_period' | 'previous_year';
  doctorId?: string;
  serviceId?: string;
  city?: string;
}

// Revenue types
export interface RevenueReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    pendingRevenue: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
  };
  byMethod: Array<{
    method: PaymentMethod;
    _sum: { amount: number };
    _count: number;
  }>;
  byStatus: Array<{
    status: PaymentStatus;
    _sum: { amount: number };
    _count: number;
  }>;
  topServices: any[];
  recentPayments: Payment[];
}

// System health types
export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  services: {
    database: string;
    redis: string;
  };
  system: {
    memory: {
      used: number;
      total: number;
      external: number;
      unit: string;
    };
    cpu: {
      user: number;
      system: number;
      unit: string;
    };
    platform: string;
    nodeVersion: string;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Filter types
export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  serviceId?: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

// Service filters
export interface ServiceFilters {
  page?: number;
  limit?: number;
  category?: ServiceCategory;
  isActive?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

// Review filters
export interface ReviewFilters {
  page?: number;
  limit?: number;
  rating?: number;
  isVerified?: boolean;
  search?: string;
  doctorId?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DoctorFilters {
  page?: number;
  limit?: number;
  specialty?: string;
  search?: string;
  isAvailable?: boolean;
  rating?: number;
  experience?: number;
}

// System log types
export interface SystemLog {
  id: string;
  level: string;
  service: string;
  message: string;
  timestamp: string;
  environment?: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

export interface SystemLogFilters {
  page?: number;
  limit?: number;
  level?: string;
  service?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
