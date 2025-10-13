import api from './api';
import type {
  DashboardStats,
  User,
  Doctor,
  Appointment,
  Payment,
  Service,
  Review,
  UserFilters,
  AppointmentFilters,
  PaymentFilters,
  PaginatedResponse,
  AnalyticsData,
  RevenueReport,
  SystemHealth,
} from '@/types';

export const adminService = {
  // Dashboard
  getDashboard: () => api.get<{ data: DashboardStats }>('/admin-panel/dashboard'),

  // Users
  getUsers: (filters: UserFilters) =>
    api.get<{ data: PaginatedResponse<User> }>('/admin-panel/users', {
      params: filters,
    }),

  getUserDetails: (id: string) => api.get<{ data: User }>(`/admin-panel/users/${id}`),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin-panel/users/${id}/status`, { isActive }),

  verifyUser: (id: string) => api.patch(`/admin-panel/users/${id}/verify`),

  deleteUser: (id: string) => api.delete(`/admin-panel/users/${id}`),

  // Doctors
  getDoctors: (filters: any) =>
    api.get<{ data: PaginatedResponse<Doctor> }>('/admin-panel/doctors', {
      params: filters,
    }),

  updateDoctorAvailability: (id: string, isAvailable: boolean) =>
    api.patch(`/admin-panel/doctors/${id}/availability`, { isAvailable }),

  // Appointments
  getAppointments: (filters: AppointmentFilters) =>
    api.get<{ data: PaginatedResponse<Appointment> }>('/admin-panel/appointments', {
      params: filters,
    }),

  updateAppointmentStatus: (id: string, status: string) =>
    api.patch(`/admin-panel/appointments/${id}/status`, { status }),

  // Payments
  getPayments: (filters: PaymentFilters) =>
    api.get<{ data: PaginatedResponse<Payment> }>('/admin-panel/payments', {
      params: filters,
    }),

  // Services
  getServices: (filters: any) =>
    api.get<{ data: PaginatedResponse<Service> }>('/admin-panel/services', {
      params: filters,
    }),

  updateServiceStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin-panel/services/${id}/status`, { isActive }),

  // Reviews
  getReviews: (filters: any) =>
    api.get<{ data: PaginatedResponse<Review> }>('/admin-panel/reviews', {
      params: filters,
    }),

  verifyReview: (id: string) => api.patch(`/admin-panel/reviews/${id}/verify`),

  deleteReview: (id: string) => api.delete(`/admin-panel/reviews/${id}`),

  // Analytics
  getAnalytics: (params: any) =>
    api.get<{ data: AnalyticsData }>('/admin-panel/analytics', { params }),

  getRevenueReport: (startDate: string, endDate: string) =>
    api.get<{ data: RevenueReport }>('/admin-panel/revenue', {
      params: { startDate, endDate },
    }),

  // System
  getSystemHealth: () => api.get<{ data: SystemHealth }>('/admin-panel/system/health'),

  getSystemLogs: (filters: any) =>
    api.get('/admin-panel/system/logs', { params: filters }),

  // Export
  exportData: (type: string, format: string, filters: any) =>
    api.post('/admin-panel/export', { type, format, filters }),
};
