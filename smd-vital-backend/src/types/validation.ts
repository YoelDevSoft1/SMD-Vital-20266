import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).refine(val => val > 0, 'Page must be greater than 0').optional().default('1'),
  limit: z.string().transform(Number).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional().default('10'),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const idSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  role: z.enum(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN']).optional().default('PATIENT'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User validation schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

// Patient validation schemas
export const createPatientSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  dateOfBirth: z.string().datetime('Invalid date format').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  address: z.string().min(10, 'Address must be at least 10 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').optional(),
  state: z.string().min(2, 'State must be at least 2 characters').optional(),
  zipCode: z.string().min(4, 'Zip code must be at least 4 characters').optional(),
  emergencyContact: z.string().min(2, 'Emergency contact must be at least 2 characters').optional(),
  emergencyPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid emergency phone format').optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial().omit({ userId: true });

// Doctor validation schemas
export const createDoctorSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  licenseNumber: z.string().min(5, 'License number must be at least 5 characters'),
  specialty: z.string().min(2, 'Specialty must be at least 2 characters'),
  experience: z.number().int().min(0, 'Experience must be non-negative').optional().default(0),
  consultationFee: z.number().positive('Consultation fee must be positive'),
  bio: z.string().optional(),
  education: z.string().optional(),
  certifications: z.string().optional(),
  languages: z.array(z.string()).optional().default([]),
  serviceAreas: z.array(z.string()).optional().default([]),
});

export const updateDoctorSchema = createDoctorSchema.partial().omit({ userId: true });

export const updateDoctorMediaSchema = z.object({
  logoPath: z.string().optional(),
  signaturePath: z.string().optional(),
});

export const doctorAvailabilitySchema = z.object({
  doctorId: z.string().cuid('Invalid doctor ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().int().min(15, 'Duration must be at least 15 minutes').optional(),
});

// Appointment validation schemas
export const createAppointmentSchema = z.object({
  patientId: z.string().cuid('Invalid patient ID'),
  doctorId: z.string().cuid('Invalid doctor ID'),
  serviceId: z.string().cuid('Invalid service ID'),
  scheduledAt: z.string().datetime('Invalid scheduled date format'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }).optional(),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  scheduledAt: z.string().datetime('Invalid scheduled date format').optional(),
  address: z.string().min(10, 'Address must be at least 10 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }).optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED']).optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
});

export const appointmentQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED']).optional(),
  doctorId: z.string().cuid('Invalid doctor ID').optional(),
  patientId: z.string().cuid('Invalid patient ID').optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
});

// Clinical validation schemas
export const clinicalVitalsSchema = z.object({
  bpSys: z.number().int().positive().optional(),
  bpDia: z.number().int().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  temperature: z.number().optional(),
  spo2: z.number().int().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  notes: z.string().optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: 'At least one vital sign value is required'
});

export const encounterNotesSchema = z.object({
  summary: z.string().min(2).optional(),
  payload: z.record(z.any()).optional(),
  templateVersion: z.string().optional()
});

const prescriptionItemSchema = z.object({
  medication: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

export const clinicalFinishSchema = z.object({
  encounterSummary: z.string().min(2).optional(),
  encounterPayload: z.record(z.any()).optional(),
  medicalRecord: z.object({
    title: z.string().min(2),
    description: z.string().min(2),
    type: z.enum(['LAB_RESULT', 'IMAGING', 'PRESCRIPTION', 'VACCINATION', 'ALLERGY', 'DIAGNOSIS', 'OTHER']).optional(),
    payload: z.record(z.any()).optional(),
    doctorNotes: z.string().optional(),
    templateVersion: z.string().optional()
  }),
  prescription: z.object({
    notes: z.string().optional(),
    templateVersion: z.string().optional(),
    items: z.array(prescriptionItemSchema).min(1)
  }).optional()
});

export const clinicalRecordByEmailSchema = z.object({
  patientEmail: z.string().email('Invalid email format'),
  patientFirstName: z.string().min(2).optional(),
  patientLastName: z.string().min(2).optional(),
  patientDateOfBirth: z.string().optional(),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  serviceName: z.string().min(2).optional(),
  sendEmail: z.boolean().optional().default(true),
  vitals: clinicalVitalsSchema.optional(),
  medicalRecord: z.object({
    title: z.string().min(2),
    description: z.string().min(2),
    type: z.enum(['LAB_RESULT', 'IMAGING', 'PRESCRIPTION', 'VACCINATION', 'ALLERGY', 'DIAGNOSIS', 'OTHER']).optional(),
    payload: z.record(z.any()).optional(),
    doctorNotes: z.string().optional(),
    templateVersion: z.string().optional()
  }),
  prescription: z.object({
    notes: z.string().optional(),
    templateVersion: z.string().optional(),
    items: z.array(prescriptionItemSchema).min(1)
  }).optional()
});

// Service validation schemas
export const createServiceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['CONSULTATION', 'EMERGENCY', 'LABORATORY', 'NURSING', 'SPECIALIST', 'THERAPY', 'VACCINATION', 'OTHER']),
  basePrice: z.number().positive('Base price must be positive'),
  duration: z.number().int().min(15, 'Duration must be at least 15 minutes'),
  requirements: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

// Payment validation schemas
export const createPaymentSchema = z.object({
  appointmentId: z.string().cuid('Invalid appointment ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'NEQUI', 'DAVIPLATA', 'PSE']),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('COP'),
});

export const processPaymentSchema = z.object({
  paymentId: z.string().cuid('Invalid payment ID'),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().optional().default(false),
});

// Review validation schemas
export const createReviewSchema = z.object({
  patientId: z.string().cuid('Invalid patient ID'),
  doctorId: z.string().cuid('Invalid doctor ID'),
  appointmentId: z.string().cuid('Invalid appointment ID').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').optional(),
});

export const reviewQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  doctorId: z.string().cuid('Invalid doctor ID').optional(),
  patientId: z.string().cuid('Invalid patient ID').optional(),
  minRating: z.string().transform(Number).refine(val => val >= 1 && val <= 5, 'Min rating must be between 1 and 5').optional(),
  maxRating: z.string().transform(Number).refine(val => val >= 1 && val <= 5, 'Max rating must be between 1 and 5').optional(),
});

// Notification validation schemas
export const createNotificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  type: z.enum(['APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'NEW_MESSAGE', 'SYSTEM_UPDATE', 'PROMOTION']),
  data: z.any().optional(),
});

export const notificationQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  isRead: z.string().transform(val => val === 'true').optional(),
  type: z.enum(['APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'NEW_MESSAGE', 'SYSTEM_UPDATE', 'PROMOTION']).optional(),
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  type: z.enum(['avatar', 'document', 'medical-record']),
  patientId: z.string().cuid('Invalid patient ID').optional(),
  appointmentId: z.string().cuid('Invalid appointment ID').optional(),
});

// Search validation schemas
export const searchQuerySchema = z.object({
  ...paginationSchema.shape,
  ...sortSchema.shape,
  q: z.string().min(1, 'Search query must not be empty').optional(),
  filters: z.record(z.any()).optional(),
});

export const doctorSearchSchema = z.object({
  ...searchQuerySchema.shape,
  specialty: z.string().optional(),
  city: z.string().optional(),
  minRating: z.string().transform(Number).refine(val => val >= 1 && val <= 5, 'Min rating must be between 1 and 5').optional(),
  maxPrice: z.string().transform(Number).refine(val => val > 0, 'Max price must be positive').optional(),
  isAvailable: z.string().transform(val => val === 'true').optional(),
  languages: z.string().transform(val => val.split(',')).optional(),
});

// Geolocation validation schemas
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

export const locationSearchSchema = z.object({
  coordinates: coordinatesSchema,
  radius: z.number().positive('Radius must be positive').optional().default(10),
  specialty: z.string().optional(),
  maxResults: z.number().int().positive('Max results must be positive').optional().default(20),
});

// Analytics validation schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  doctorId: z.string().cuid('Invalid doctor ID').optional(),
  serviceId: z.string().cuid('Invalid service ID').optional(),
  city: z.string().optional(),
});

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Email validation schema
export const emailSchema = z.string().email('Invalid email format');

// Phone validation schema
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Date validation schema
export const dateSchema = z.string().datetime('Invalid date format');

// URL validation schema
export const urlSchema = z.string().url('Invalid URL format');

// Export all schemas
export const validationSchemas = {
  // Common
  pagination: paginationSchema,
  sort: sortSchema,
  id: idSchema,
  
  // Authentication
  login: loginSchema,
  register: registerSchema,
  refreshToken: refreshTokenSchema,
  
  // User
  updateUser: updateUserSchema,
  
  // Patient
  createPatient: createPatientSchema,
  updatePatient: updatePatientSchema,
  
  // Doctor
  createDoctor: createDoctorSchema,
  updateDoctor: updateDoctorSchema,
  doctorAvailability: doctorAvailabilitySchema,
  
  // Appointment
  createAppointment: createAppointmentSchema,
  updateAppointment: updateAppointmentSchema,
  appointmentQuery: appointmentQuerySchema,
  clinicalVitals: clinicalVitalsSchema,
  encounterNotes: encounterNotesSchema,
  clinicalFinish: clinicalFinishSchema,
  clinicalRecordByEmail: clinicalRecordByEmailSchema,
  
  // Service
  createService: createServiceSchema,
  updateService: updateServiceSchema,
  
  // Payment
  createPayment: createPaymentSchema,
  processPayment: processPaymentSchema,
  
  // Review
  createReview: createReviewSchema,
  updateReview: updateReviewSchema,
  reviewQuery: reviewQuerySchema,
  
  // Notification
  createNotification: createNotificationSchema,
  notificationQuery: notificationQuerySchema,
  
  // File Upload
  fileUpload: fileUploadSchema,
  
  // Search
  searchQuery: searchQuerySchema,
  doctorSearch: doctorSearchSchema,
  
  // Geolocation
  coordinates: coordinatesSchema,
  locationSearch: locationSearchSchema,
  
  // Analytics
  analyticsQuery: analyticsQuerySchema,
  
  // Common fields
  password: passwordSchema,
  email: emailSchema,
  phone: phoneSchema,
  date: dateSchema,
  url: urlSchema,
};



