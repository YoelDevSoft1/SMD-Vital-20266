// Admin Panel Types

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
    appointments: any[];
    users: any[];
  };
  topPerformers: {
    doctors: any[];
    services: any[];
  };
}

export interface AnalyticsParams {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface AnalyticsData {
  period: {
    start: Date;
    end: Date;
    groupBy: string;
  };
  trends: any[];
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalUsers: number;
    averageOrderValue: number;
  };
}

export interface RevenueReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRevenue: number;
    pendingRevenue: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
  };
  byMethod: any[];
  byStatus: any[];
  topServices: any[];
  recentPayments: any[];
}

export interface UserFilters {
  page: number;
  limit: number;
  role?: string;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface DoctorFilters {
  page: number;
  limit: number;
  specialty?: string;
  isAvailable?: boolean;
  search?: string;
}

export interface AppointmentFilters {
  page: number;
  limit: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
}

export interface PaymentFilters {
  page: number;
  limit: number;
  status?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ServiceFilters {
  page: number;
  limit: number;
  category?: string;
  isActive?: boolean;
}

export interface ReviewFilters {
  page: number;
  limit: number;
  doctorId?: string;
  minRating?: number;
  isVerified?: boolean;
}

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

export interface LogFilters {
  level?: string;
  limit: number;
  startDate?: string;
  endDate?: string;
}

export interface ExportParams {
  type: 'users' | 'appointments' | 'payments' | 'doctors' | 'services' | 'reviews';
  format: 'json' | 'csv' | 'excel';
  filters?: any;
}

export interface ExportResult {
  type: string;
  format: string;
  count: number;
  data: any[];
  exportedAt: string;
}

// Pagination response
export interface PaginatedResult<T> {
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

// Admin activity log
export interface AdminActivity {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// System settings
export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  isActive: boolean;
  updatedBy?: string;
  updatedAt: Date;
}

// Notification template
export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Bulk action result
export interface BulkActionResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// Report generation
export interface ReportParams {
  type: 'appointments' | 'revenue' | 'doctors' | 'patients' | 'services';
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  filters?: any;
}

// Dashboard widget
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'stat' | 'list';
  data: any;
  config?: any;
}

// Permission
export interface AdminPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// Admin role
export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  permissions: AdminPermission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
