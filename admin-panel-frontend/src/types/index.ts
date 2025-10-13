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
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
  patient?: {
    user: User;
  };
  doctor?: {
    user: User;
  };
  service?: Service;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
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
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}
