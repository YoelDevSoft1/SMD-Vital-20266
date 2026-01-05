import api from './api';
import type {
  ApiResponse,
  AnalyticsData,
  AnalyticsFilters,
  Appointment,
  AppointmentFilters,
  DashboardStats,
  Doctor,
  DoctorFilters,
  PaginatedResponse,
  Payment,
  PaymentFilters,
  Review,
  ReviewFilters,
  RevenueReport,
  Service,
  ServiceFilters,
  SystemHealth,
  SystemLog,
  SystemLogFilters,
  User,
  UserFilters,
} from '@/types';

export const adminService = {
  // Dashboard
  getDashboard: () =>
    api.get<ApiResponse<DashboardStats>>('/admin-panel/dashboard'),

  // Users
  getUsers: (filters: UserFilters) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/admin-panel/users', {
      params: filters,
    }),

  getUserDetails: (id: string) =>
    api.get<ApiResponse<User>>(`/admin-panel/users/${id}`),

  createUser: (data: any) =>
    api.post<ApiResponse<User>>('/admin-panel/users', data),

  updateUser: (id: string, data: any) =>
    api.put<ApiResponse<User>>(`/admin-panel/users/${id}`, data),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse<User>>(`/admin-panel/users/${id}/status`, { isActive }),

  verifyUser: (id: string) =>
    api.patch<ApiResponse<User>>(`/admin-panel/users/${id}/verify`),

  deleteUser: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin-panel/users/${id}`),

  // Doctors
  getDoctors: (filters: DoctorFilters) =>
    api.get<ApiResponse<PaginatedResponse<Doctor>>>('/admin-panel/doctors', {
      params: filters,
    }),

  getDoctorDetails: (id: string) =>
    api.get<ApiResponse<Doctor>>(`/admin-panel/doctors/${id}`),

  createDoctor: (data: any) =>
    api.post<ApiResponse<Doctor>>('/admin-panel/doctors', data),

  updateDoctor: (id: string, data: any) =>
    api.put<ApiResponse<Doctor>>(`/admin-panel/doctors/${id}`, data),

  updateDoctorAvailability: (id: string, isAvailable: boolean) =>
    api.patch<ApiResponse<null>>(`/admin-panel/doctors/${id}/availability`, {
      isAvailable,
    }),

  updateDoctorMedia: (id: string, data: { logoPath?: string; signaturePath?: string }) =>
    api.patch<ApiResponse<Doctor>>(`/admin-panel/doctors/${id}/media`, data),

  deleteDoctor: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin-panel/doctors/${id}`),

  // Appointments
  getAppointments: (filters: AppointmentFilters) =>
    api.get<ApiResponse<PaginatedResponse<Appointment>>>(
      '/admin-panel/appointments',
      {
        params: filters,
      },
    ),

  getAppointmentDetails: (id: string) =>
    api.get<ApiResponse<Appointment>>(`/admin-panel/appointments/${id}`),

  createAppointment: (data: any) =>
    api.post<ApiResponse<Appointment>>('/admin-panel/appointments', data),

  updateAppointment: (id: string, data: any) =>
    api.put<ApiResponse<Appointment>>(`/admin-panel/appointments/${id}`, data),

  updateAppointmentStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Appointment>>(
      `/admin-panel/appointments/${id}/status`,
      { status },
    ),

  deleteAppointment: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin-panel/appointments/${id}`),

  // Patients
  getPatients: (filters: UserFilters) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/admin-panel/patients', {
      params: filters,
    }),

  // Payments
  getPayments: (filters: PaymentFilters) =>
    api.get<ApiResponse<PaginatedResponse<Payment>>>('/admin-panel/payments', {
      params: filters,
    }),

  getPaymentDetails: (id: string) =>
    api.get<ApiResponse<Payment>>(`/admin-panel/payments/${id}`),

  createPayment: (data: any) =>
    api.post<ApiResponse<Payment>>('/admin-panel/payments', data),

  updatePayment: (id: string, data: any) =>
    api.put<ApiResponse<Payment>>(`/admin-panel/payments/${id}`, data),

  updatePaymentStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Payment>>(`/admin-panel/payments/${id}/status`, {
      status,
    }),

  deletePayment: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin-panel/payments/${id}`),

  // Services
  getServices: (filters: ServiceFilters) =>
    api.get<ApiResponse<PaginatedResponse<Service>>>('/admin-panel/services', {
      params: filters,
    }),

  getServiceDetails: (id: string) =>
    api.get<ApiResponse<Service>>(`/admin-panel/services/${id}`),

  createService: (serviceData: any) =>
    api.post<ApiResponse<Service>>('/admin-panel/services', serviceData),

  updateService: (id: string, serviceData: any) =>
    api.put<ApiResponse<Service>>(`/admin-panel/services/${id}`, serviceData),

  updateServiceStatus: (id: string, isActive: boolean) =>
    api.patch<ApiResponse<Service>>(`/admin-panel/services/${id}/status`, {
      isActive,
    }),

  deleteService: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin-panel/services/${id}`),

  // Reviews
  getReviews: (filters: ReviewFilters) =>
    api.get<ApiResponse<PaginatedResponse<Review>>>('/admin-panel/reviews', {
      params: filters,
    }),

  getReviewDetails: (id: string) =>
    api.get<ApiResponse<Review>>(`/admin-panel/reviews/${id}`),

  createReview: (reviewData: any) =>
    api.post<ApiResponse<Review>>('/admin-panel/reviews', reviewData),

  updateReview: (id: string, reviewData: any) =>
    api.put<ApiResponse<Review>>(`/admin-panel/reviews/${id}`, reviewData),

  verifyReview: (id: string) =>
    api.patch<ApiResponse<Review>>(`/admin-panel/reviews/${id}/verify`),

  deleteReview: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin-panel/reviews/${id}`),

  // Analytics
  getAnalytics: (params: AnalyticsFilters) =>
    api.get<ApiResponse<AnalyticsData>>('/admin-panel/analytics', { params }),

  getRevenueReport: (startDate: string, endDate: string) =>
    api.get<ApiResponse<RevenueReport>>('/admin-panel/revenue', {
      params: { startDate, endDate },
    }),

  getRevenueAnalytics: (months?: number) =>
    api.get<ApiResponse<any>>('/admin-panel/analytics/revenue', {
      params: { months },
    }),

  // System
  getSystemHealth: () =>
    api.get<ApiResponse<SystemHealth>>('/admin-panel/system/health'),

  getSystemLogs: (filters: SystemLogFilters) =>
    api.get<ApiResponse<PaginatedResponse<SystemLog>>>(
      '/admin-panel/system/logs',
      {
        params: filters,
      },
    ),

  // Export
  exportData: (type: string, format: string, filters: any) =>
    api.post('/admin-panel/export', { type, format, filters }),
};
