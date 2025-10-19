import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../utils/logger';

// Enable default metrics collection
collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type']
});

export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

export const redisConnections = new Gauge({
  name: 'redis_connections_active',
  help: 'Number of active Redis connections'
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Total number of active users'
});

export const totalAppointments = new Gauge({
  name: 'appointments_total',
  help: 'Total number of appointments'
});

export const pendingAppointments = new Gauge({
  name: 'appointments_pending_total',
  help: 'Total number of pending appointments'
});

export const completedAppointments = new Gauge({
  name: 'appointments_completed_total',
  help: 'Total number of completed appointments'
});

export const totalRevenue = new Gauge({
  name: 'revenue_total',
  help: 'Total revenue in COP'
});

export class MetricsService {
  private static instance: MetricsService;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Start metrics collection
   */
  public start(): void {
    try {
      // Start periodic metrics updates
      this.updateInterval = setInterval(() => {
        this.updateCustomMetrics();
      }, 30000); // Update every 30 seconds

      logger.info('Metrics service started');
    } catch (error) {
      logger.error('Failed to start metrics service:', error);
    }
  }

  /**
   * Stop metrics collection
   */
  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('Metrics service stopped');
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Record HTTP request metrics
   */
  public recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    try {
      const labels = { method, route, status_code: statusCode.toString() };
      
      httpRequestDuration.observe(labels, duration);
      httpRequestTotal.inc(labels);

      if (statusCode >= 400) {
        httpRequestErrors.inc({
          method,
          route,
          error_type: statusCode >= 500 ? 'server_error' : 'client_error'
        });
      }
    } catch (error) {
      logger.error('Error recording HTTP metrics:', error);
    }
  }

  /**
   * Update custom metrics
   */
  private async updateCustomMetrics(): Promise<void> {
    try {
      // This would be implemented with actual database queries
      // For now, we'll set some placeholder values
      databaseConnections.set(1);
      redisConnections.set(1);
      
      // These would be actual counts from the database
      activeUsers.set(0);
      totalAppointments.set(0);
      pendingAppointments.set(0);
      completedAppointments.set(0);
      totalRevenue.set(0);
    } catch (error) {
      logger.error('Error updating custom metrics:', error);
    }
  }

  /**
   * Update business metrics (to be called from controllers)
   */
  public updateBusinessMetrics(data: {
    activeUsers?: number;
    totalAppointments?: number;
    pendingAppointments?: number;
    completedAppointments?: number;
    totalRevenue?: number;
  }): void {
    try {
      if (data.activeUsers !== undefined) activeUsers.set(data.activeUsers);
      if (data.totalAppointments !== undefined) totalAppointments.set(data.totalAppointments);
      if (data.pendingAppointments !== undefined) pendingAppointments.set(data.pendingAppointments);
      if (data.completedAppointments !== undefined) completedAppointments.set(data.completedAppointments);
      if (data.totalRevenue !== undefined) totalRevenue.set(data.totalRevenue);
    } catch (error) {
      logger.error('Error updating business metrics:', error);
    }
  }
}

export default MetricsService;




