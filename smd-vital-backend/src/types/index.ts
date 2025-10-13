// import { Request } from 'express';
import { User, UserRole, AppointmentStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: User;
      userId?: string;
      userRole?: UserRole;
    }
  }
}

// Common API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User types
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

// Patient types
export interface CreatePatientRequest {
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
}

export interface UpdatePatientRequest {
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
}

// Doctor types
export interface CreateDoctorRequest {
  userId: string;
  licenseNumber: string;
  specialty: string;
  experience?: number;
  consultationFee: number;
  bio?: string;
  education?: string;
  certifications?: string;
  languages?: string[];
  serviceAreas?: string[];
}

export interface UpdateDoctorRequest {
  specialty?: string;
  experience?: number;
  consultationFee?: number;
  bio?: string;
  education?: string;
  certifications?: string;
  languages?: string[];
  serviceAreas?: string[];
  isAvailable?: boolean;
}

export interface DoctorAvailabilityRequest {
  doctorId: string;
  date: string;
  duration?: number;
}

export interface DoctorAvailabilityResponse {
  date: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Appointment types
export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: string;
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

export interface UpdateAppointmentRequest {
  scheduledAt?: string;
  address?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  status?: AppointmentStatus;
  diagnosis?: string;
  prescription?: string;
}

export interface AppointmentQueryParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Service types
export interface CreateServiceRequest {
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  requirements?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  duration?: number;
  requirements?: string;
  isActive?: boolean;
}

// Payment types
export interface CreatePaymentRequest {
  appointmentId: string;
  amount: number;
  method: PaymentMethod;
  currency?: string;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  clientSecret?: string;
  requiresAction?: boolean;
}

// Review types
export interface CreateReviewRequest {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  doctorId?: string;
  patientId?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Notification types
export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// File upload types
export interface FileUploadRequest {
  file: Express.Multer.File;
  type: 'avatar' | 'document' | 'medical-record';
  patientId?: string;
  appointmentId?: string;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Search and filter types
export interface SearchQueryParams {
  q?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorSearchParams extends SearchQueryParams {
  specialty?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  languages?: string[];
}

export interface AppointmentSearchParams extends SearchQueryParams {
  status?: AppointmentStatus;
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
}

// Geolocation types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationSearchParams {
  coordinates: Coordinates;
  radius?: number; // in kilometers
  specialty?: string;
  maxResults?: number;
}

export interface LocationSearchResult {
  doctor: any;
  distance: number;
  estimatedTravelTime: number;
}

// Analytics types
export interface AnalyticsQueryParams {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  doctorId?: string;
  serviceId?: string;
  city?: string;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  revenue: number;
  averageRating: number;
  trends: {
    date: string;
    count: number;
    revenue: number;
  }[];
}

export interface DoctorAnalytics {
  doctorId: string;
  totalAppointments: number;
  completedAppointments: number;
  averageRating: number;
  totalRevenue: number;
  specialties: string[];
  topServices: {
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }[];
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Socket.io types
export interface SocketEvents {
  // Client to Server
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'send-message': (data: { roomId: string; message: string }) => void;
  'appointment-update': (data: { appointmentId: string; status: AppointmentStatus }) => void;

  // Server to Client
  'message-received': (data: { message: string; timestamp: string; sender: string }) => void;
  'appointment-status-changed': (data: { appointmentId: string; status: AppointmentStatus }) => void;
  'notification': (data: { title: string; message: string; type: string }) => void;
  'error': (data: { message: string; code: string }) => void;
}

// Queue job types
export interface QueueJobData {
  type: string;
  payload: any;
  priority?: number;
  delay?: number;
  attempts?: number;
}

export interface EmailJobData extends QueueJobData {
  type: 'email';
  payload: {
    to: string;
    subject: string;
    template: string;
    data: any;
  };
}

export interface SMSJobData extends QueueJobData {
  type: 'sms';
  payload: {
    to: string;
    message: string;
  };
}

export interface NotificationJobData extends QueueJobData {
  type: 'notification';
  payload: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  };
}

// Export all types
export * from './validation';
export * from './database';

