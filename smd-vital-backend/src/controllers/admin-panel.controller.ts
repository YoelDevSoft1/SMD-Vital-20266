import { Request, Response } from 'express';
import { AdminPanelService } from '../services/admin-panel.service';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

export class AdminPanelController {
  private adminService: AdminPanelService;

  constructor() {
    this.adminService = new AdminPanelService();
  }

  /**
   * @desc    Get dashboard statistics
   * @route   GET /api/v1/admin-panel/dashboard
   * @access  Private/Admin
   */
  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();

      const response: ApiResponse = {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get advanced analytics
   * @route   GET /api/v1/admin-panel/analytics
   * @access  Private/Admin
   */
  public getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, groupBy } = req.query;

      const analytics = await this.adminService.getAnalytics({
        startDate: startDate as string,
        endDate: endDate as string,
        groupBy: groupBy as 'day' | 'week' | 'month'
      });

      const response: ApiResponse = {
        success: true,
        message: 'Analytics retrieved successfully',
        data: analytics,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get revenue report
   * @route   GET /api/v1/admin-panel/revenue
   * @access  Private/Admin
   */
  public getRevenueReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const revenue = await this.adminService.getRevenueReport(
        startDate as string,
        endDate as string
      );

      const response: ApiResponse = {
        success: true,
        message: 'Revenue report retrieved successfully',
        data: revenue,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching revenue report:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching revenue report',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all users with filters
   * @route   GET /api/v1/admin-panel/users
   * @access  Private/Admin
   */
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', role, search, isActive, isVerified } = req.query;

      const result = await this.adminService.getUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined
      });

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get user details
   * @route   GET /api/v1/admin-panel/users/:id
   * @access  Private/Admin
   */
  public getUserDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await this.adminService.getUserDetails(id);

      const response: ApiResponse = {
        success: true,
        message: 'User details retrieved successfully',
        data: user,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching user details:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'User not found',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update user status
   * @route   PATCH /api/v1/admin-panel/users/:id/status
   * @access  Private/Admin
   */
  public updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await this.adminService.updateUserStatus(id, isActive);

      const response: ApiResponse = {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user status',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Verify user
   * @route   PATCH /api/v1/admin-panel/users/:id/verify
   * @access  Private/Admin
   */
  public verifyUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await this.adminService.verifyUser(id);

      const response: ApiResponse = {
        success: true,
        message: 'User verified successfully',
        data: user,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error verifying user:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying user',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Delete user
   * @route   DELETE /api/v1/admin-panel/users/:id
   * @access  Private/Admin
   */
  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.adminService.deleteUser(id);

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all doctors with filters
   * @route   GET /api/v1/admin-panel/doctors
   * @access  Private/Admin
   */
  public getDoctors = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', specialty, isAvailable, search } = req.query;

      const result = await this.adminService.getDoctors({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        specialty: specialty as string,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
        search: search as string
      });

      const response: ApiResponse = {
        success: true,
        message: 'Doctors retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching doctors',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update doctor availability
   * @route   PATCH /api/v1/admin-panel/doctors/:id/availability
   * @access  Private/Admin
   */
  public updateDoctorAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;

      const doctor = await this.adminService.updateDoctorAvailability(id, isAvailable);

      const response: ApiResponse = {
        success: true,
        message: 'Doctor availability updated successfully',
        data: doctor,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating doctor availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating doctor availability',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all appointments with filters
   * @route   GET /api/v1/admin-panel/appointments
   * @access  Private/Admin
   */
  public getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', status, dateFrom, dateTo, doctorId, patientId } = req.query;

      const result = await this.adminService.getAppointments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        doctorId: doctorId as string,
        patientId: patientId as string
      });

      const response: ApiResponse = {
        success: true,
        message: 'Appointments retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching appointments',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update appointment status
   * @route   PATCH /api/v1/admin-panel/appointments/:id/status
   * @access  Private/Admin
   */
  public updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const appointment = await this.adminService.updateAppointmentStatus(id, status);

      const response: ApiResponse = {
        success: true,
        message: 'Appointment status updated successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating appointment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating appointment status',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all payments with filters
   * @route   GET /api/v1/admin-panel/payments
   * @access  Private/Admin
   */
  public getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', status, method, dateFrom, dateTo } = req.query;

      const result = await this.adminService.getPayments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        method: method as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });

      const response: ApiResponse = {
        success: true,
        message: 'Payments retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payments',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all services
   * @route   GET /api/v1/admin-panel/services
   * @access  Private/Admin
   */
  public getServices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', category, isActive } = req.query;

      const result = await this.adminService.getServices({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });

      const response: ApiResponse = {
        success: true,
        message: 'Services retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching services',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update service status
   * @route   PATCH /api/v1/admin-panel/services/:id/status
   * @access  Private/Admin
   */
  public updateServiceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const service = await this.adminService.updateServiceStatus(id, isActive);

      const response: ApiResponse = {
        success: true,
        message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: service,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating service status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating service status',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all reviews
   * @route   GET /api/v1/admin-panel/reviews
   * @access  Private/Admin
   */
  public getReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', doctorId, minRating, isVerified } = req.query;

      const result = await this.adminService.getReviews({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        doctorId: doctorId as string,
        minRating: minRating ? parseInt(minRating as string) : undefined,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined
      });

      const response: ApiResponse = {
        success: true,
        message: 'Reviews retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reviews',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Verify review
   * @route   PATCH /api/v1/admin-panel/reviews/:id/verify
   * @access  Private/Admin
   */
  public verifyReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const review = await this.adminService.verifyReview(id);

      const response: ApiResponse = {
        success: true,
        message: 'Review verified successfully',
        data: review,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error verifying review:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying review',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Delete review
   * @route   DELETE /api/v1/admin-panel/reviews/:id
   * @access  Private/Admin
   */
  public deleteReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.adminService.deleteReview(id);

      const response: ApiResponse = {
        success: true,
        message: 'Review deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting review',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get system health
   * @route   GET /api/v1/admin-panel/system/health
   * @access  Private/Admin
   */
  public getSystemHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.adminService.getSystemHealth();

      const response: ApiResponse = {
        success: true,
        message: 'System health retrieved successfully',
        data: health,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error checking system health:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking system health',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get system logs
   * @route   GET /api/v1/admin-panel/system/logs
   * @access  Private/Admin
   */
  public getSystemLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { level, limit = '100', startDate, endDate } = req.query;

      const logs = await this.adminService.getSystemLogs({
        level: level as string,
        limit: parseInt(limit as string),
        startDate: startDate as string,
        endDate: endDate as string
      });

      const response: ApiResponse = {
        success: true,
        message: 'System logs retrieved successfully',
        data: logs,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching system logs',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Export data
   * @route   POST /api/v1/admin-panel/export
   * @access  Private/Admin
   */
  public exportData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, format, filters } = req.body;

      const exportData = await this.adminService.exportData(type, format, filters);

      const response: ApiResponse = {
        success: true,
        message: 'Data exported successfully',
        data: exportData,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting data',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };
}
