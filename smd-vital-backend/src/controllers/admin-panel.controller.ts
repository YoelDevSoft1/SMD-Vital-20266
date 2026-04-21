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
        ...(isActive && { isActive: isActive === 'true' ? true : false }),
        ...(isVerified && { isVerified: isVerified === 'true' ? true : false })
      });

      const response: ApiResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          data: result.data,
          pagination: result.pagination
        },
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
   * @desc    Create new user
   * @route   POST /api/v1/admin-panel/users
   * @access  Private/Admin
   */
  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, phone, role, isActive, isVerified } = req.body;

      const result = await this.adminService.createUser({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        isActive: isActive !== undefined ? isActive : true,
        isVerified: isVerified !== undefined ? isVerified : false
      });

      const response: ApiResponse = {
        success: true,
        message: 'User created successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating user:', error);
      res.status(400).json({
        success: false,
        message: 'Error creating user',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email, firstName, lastName, phone, role, isActive, isVerified } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const result = await this.adminService.updateUser(id, {
        email,
        firstName,
        lastName,
        phone,
        role,
        isActive,
        isVerified
      });

      const response: ApiResponse = {
        success: true,
        message: 'User updated successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating user:', error);
      res.status(400).json({
        success: false,
        message: 'Error updating user',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      await this.adminService.deleteUser(id);

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
        data: null,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting user:', error);
      res.status(400).json({
        success: false,
        message: 'Error deleting user',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  // ==================== DOCTORS ====================

  /**
   * @desc    Get all doctors with filters
   * @route   GET /api/v1/admin-panel/doctors
   * @access  Private/Admin
   */
  public getDoctors = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, search, specialty, isAvailable, rating, experience } = req.query;

      const result = await this.adminService.getDoctors({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        specialty: specialty as string,
        ...(isAvailable && { isAvailable: isAvailable === 'true' }),
        ...(rating && { rating: parseInt(rating as string) }),
        ...(experience && { experience: parseInt(experience as string) }),
      });

      // Ensure dates are properly serialized
      const doctorsWithSerializedDates = result.data.map((doctor: any) => ({
        ...doctor,
        user: {
          ...doctor.user,
          createdAt: doctor.user.createdAt ? new Date(doctor.user.createdAt).toISOString() : null,
          updatedAt: doctor.user.updatedAt ? new Date(doctor.user.updatedAt).toISOString() : null,
        }
      }));

      const response: ApiResponse = {
        success: true,
        message: 'Doctors retrieved successfully',
        data: {
          data: doctorsWithSerializedDates,
          pagination: result.pagination
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting doctors:', error);
      res.status(400).json({
        success: false,
        message: 'Error getting doctors',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Create new doctor
   * @route   POST /api/v1/admin-panel/doctors
   * @access  Private/Admin
   */
  public createDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        email, password, firstName, lastName, phone,
        licenseNumber, specialty, experience, consultationFee, bio, isAvailable 
      } = req.body;

      const result = await this.adminService.createDoctor({
        email,
        password,
        firstName,
        lastName,
        phone,
        licenseNumber,
        specialty,
        experience: parseInt(experience),
        consultationFee: parseInt(consultationFee),
        bio,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      });

      const response: ApiResponse = {
        success: true,
        message: 'Doctor created successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating doctor:', error);
      res.status(400).json({
        success: false,
        message: 'Error creating doctor',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update doctor
   * @route   PUT /api/v1/admin-panel/doctors/:id
   * @access  Private/Admin
   */
  public updateDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        email, firstName, lastName, phone,
        licenseNumber, specialty, experience, consultationFee, bio, isAvailable 
      } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const result = await this.adminService.updateDoctor(id, {
        email,
        firstName,
        lastName,
        phone,
        licenseNumber,
        specialty,
        experience: parseInt(experience),
        consultationFee: parseInt(consultationFee),
        bio,
        isAvailable
      });

      const response: ApiResponse = {
        success: true,
        message: 'Doctor updated successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating doctor:', error);
      res.status(400).json({
        success: false,
        message: 'Error updating doctor',
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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      await this.adminService.updateDoctorAvailability(id, isAvailable);

      const response: ApiResponse = {
        success: true,
        message: 'Doctor availability updated successfully',
        data: null,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating doctor availability:', error);
      res.status(400).json({
        success: false,
        message: 'Error updating doctor availability',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  public getDoctorDailyAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, duration = '60' } = req.query;

      if (!id || typeof date !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Doctor ID and date are required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const result = await this.adminService.getDoctorDailyAvailability(
        id,
        date,
        parseInt(duration as string, 10)
      );

      const response: ApiResponse = {
        success: true,
        message: 'Doctor availability retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching doctor availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching doctor availability',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  public getDoctorDailyRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!id || typeof date !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Doctor ID and date are required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const result = await this.adminService.getDoctorDailyRoute(id, date);

      const response: ApiResponse = {
        success: true,
        message: 'Doctor route retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching doctor route:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching doctor route',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update doctor media (logo and signature)
   * @route   PATCH /api/v1/admin-panel/doctors/:id/media
   * @access  Private/Admin
   */
  public updateDoctorMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { logoPath, signaturePath } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const doctor = await this.adminService.updateDoctorMedia(id, { logoPath, signaturePath });

      const response: ApiResponse = {
        success: true,
        message: 'Doctor media updated successfully',
        data: doctor,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating doctor media:', error);
      res.status(400).json({
        success: false,
        message: 'Error updating doctor media',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Upload doctor media files (logo and signature)
   * @route   POST /api/v1/admin-panel/doctors/:id/upload-media
   * @access  Private/Admin
   */
  public uploadDoctorMediaFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const updateData: { logoPath?: string; signaturePath?: string } = {};

      // Process uploaded logo
      if (files['logo'] && files['logo'][0]) {
        const logoFile = files['logo'][0];
        // Store relative path from uploads directory
        updateData.logoPath = `doctors/logos/${logoFile.filename}`;
      }

      // Process uploaded signature
      if (files['signature'] && files['signature'][0]) {
        const signatureFile = files['signature'][0];
        // Store relative path from uploads directory
        updateData.signaturePath = `doctors/signatures/${signatureFile.filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded. Please provide logo or signature file',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const doctor = await this.adminService.updateDoctorMedia(id, updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Doctor media files uploaded successfully',
        data: {
          doctor,
          uploadedFiles: updateData
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error uploading doctor media files:', error);
      res.status(400).json({
        success: false,
        message: 'Error uploading doctor media files',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Delete doctor
   * @route   DELETE /api/v1/admin-panel/doctors/:id
   * @access  Private/Admin
   */
  public deleteDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      await this.adminService.deleteDoctor(id);

      const response: ApiResponse = {
        success: true,
        message: 'Doctor deleted successfully',
        data: null,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting doctor:', error);
      res.status(400).json({
        success: false,
        message: 'Error deleting doctor',
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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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
   * @desc    Get all appointments with filters
   * @route   GET /api/v1/admin-panel/appointments
   * @access  Private/Admin
   */
  public getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', search, status, dateFrom, dateTo, doctorId, patientId, serviceId } = req.query;

      const result = await this.adminService.getAppointments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        doctorId: doctorId as string,
        patientId: patientId as string,
        serviceId: serviceId as string
      });

      const response: ApiResponse = {
        success: true,
        message: 'Appointments retrieved successfully',
        data: {
          data: result.data,
          pagination: result.pagination
        },
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
   * @desc    Get appointment details by ID
   * @route   GET /api/v1/admin-panel/appointments/:id
   * @access  Private/Admin
   */
  public getAppointmentDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const appointment = await this.adminService.getAppointmentDetails(id);

      const response: ApiResponse = {
        success: true,
        message: 'Appointment details retrieved successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching appointment details:', error);
      const isNotFound = error.message === 'Appointment not found';
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        message: isNotFound ? 'Appointment not found' : 'Error fetching appointment details',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Create new appointment
   * @route   POST /api/v1/admin-panel/appointments
   * @access  Private/Admin
   */
  public createAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointmentData = req.body;

      const appointment = await this.adminService.createAppointment(appointmentData);

      const response: ApiResponse = {
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating appointment',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update appointment
   * @route   PUT /api/v1/admin-panel/appointments/:id
   * @access  Private/Admin
   */
  public updateAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const appointmentData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const appointment = await this.adminService.updateAppointment(id, appointmentData);

      const response: ApiResponse = {
        success: true,
        message: 'Appointment updated successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating appointment',
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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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
   * @desc    Delete appointment
   * @route   DELETE /api/v1/admin-panel/appointments/:id
   * @access  Private/Admin
   */
  public deleteAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      await this.adminService.deleteAppointment(id);

      const response: ApiResponse = {
        success: true,
        message: 'Appointment deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting appointment',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Get all patients with filters
   * @route   GET /api/v1/admin-panel/patients
   * @access  Private/Admin
   */
  public createQuickPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, documentId, phone } = req.body;
      if (!firstName || !lastName || !documentId) {
        res.status(400).json({ success: false, message: 'firstName, lastName y documentId son requeridos' });
        return;
      }
      const patient = await this.adminService.createQuickPatient({ firstName, lastName, documentId, phone });
      res.status(201).json({ success: true, message: 'Paciente creado', data: patient });
    } catch (error: any) {
      logger.error('Error creating quick patient:', error);
      res.status(500).json({ success: false, message: 'Error creando paciente', error: error.message });
    }
  };

  public getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = '1', limit = '10', search, isActive, isVerified } = req.query;

      const result = await this.adminService.getPatients({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        ...(isActive && { isActive: isActive === 'true' }),
        ...(isVerified && { isVerified: isVerified === 'true' })
      });

      const response: ApiResponse = {
        success: true,
        message: 'Patients retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching patients:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching patients',
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
   * @desc    Get payment details by ID
   * @route   GET /api/v1/admin-panel/payments/:id
   * @access  Private/Admin
   */
  public getPaymentDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const payment = await this.adminService.getPaymentDetails(id);

      const response: ApiResponse = {
        success: true,
        message: 'Payment details retrieved successfully',
        data: payment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching payment details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment details',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Create new payment
   * @route   POST /api/v1/admin-panel/payments
   * @access  Private/Admin
   */
  public createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const paymentData = req.body;

      const payment = await this.adminService.createPayment(paymentData);

      const response: ApiResponse = {
        success: true,
        message: 'Payment created successfully',
        data: payment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating payment',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update payment
   * @route   PUT /api/v1/admin-panel/payments/:id
   * @access  Private/Admin
   */
  public updatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const paymentData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const payment = await this.adminService.updatePayment(id, paymentData);

      const response: ApiResponse = {
        success: true,
        message: 'Payment updated successfully',
        data: payment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating payment',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update payment status
   * @route   PATCH /api/v1/admin-panel/payments/:id/status
   * @access  Private/Admin
   */
  public updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const payment = await this.adminService.updatePaymentStatus(id, status);

      const response: ApiResponse = {
        success: true,
        message: 'Payment status updated successfully',
        data: payment,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating payment status',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Delete payment
   * @route   DELETE /api/v1/admin-panel/payments/:id
   * @access  Private/Admin
   */
  public deletePayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      await this.adminService.deletePayment(id);

      const response: ApiResponse = {
        success: true,
        message: 'Payment deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting payment',
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
        ...(isActive && { isActive: isActive === 'true' ? true : false })
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
   * @desc    Get service details by ID
   * @route   GET /api/v1/admin-panel/services/:id
   * @access  Private/Admin
   */
  public getServiceDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Service ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const service = await this.adminService.getServiceDetails(id);

      const response: ApiResponse = {
        success: true,
        message: 'Service details retrieved successfully',
        data: service,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching service details:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Service not found',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Create new service
   * @route   POST /api/v1/admin-panel/services
   * @access  Private/Admin
   */
  public createService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, category, basePrice, duration, isActive, requirements } = req.body;

      if (!name || !description || !category) {
        res.status(400).json({
          success: false,
          message: 'Name, description, and category are required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const parsedBasePrice = Number(basePrice);
      const parsedDuration = Number(duration);

      if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
        res.status(400).json({
          success: false,
          message: 'Base price must be a positive number',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        res.status(400).json({
          success: false,
          message: 'Duration must be a positive number',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const service = await this.adminService.createService({
        name,
        description,
        category,
        basePrice: parsedBasePrice,
        duration: parsedDuration,
        isActive: isActive !== undefined ? isActive : true,
        requirements: requirements ?? null
      });

      const response: ApiResponse = {
        success: true,
        message: 'Service created successfully',
        data: service,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating service:', error);
      res.status(400).json({
        success: false,
        message: 'Error creating service',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update service
   * @route   PUT /api/v1/admin-panel/services/:id
   * @access  Private/Admin
   */
  public updateService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, category, basePrice, duration, isActive, requirements } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Service ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const updateData: {
        name?: string;
        description?: string;
        category?: string;
        basePrice?: number;
        duration?: number;
        isActive?: boolean;
        requirements?: string | null;
      } = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (requirements !== undefined) updateData.requirements = requirements ?? null;

      if (basePrice !== undefined) {
        const parsedBasePrice = Number(basePrice);
        if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
          res.status(400).json({
            success: false,
            message: 'Base price must be a positive number',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          });
          return;
        }
        updateData.basePrice = parsedBasePrice;
      }

      if (duration !== undefined) {
        const parsedDuration = Number(duration);
        if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
          res.status(400).json({
            success: false,
            message: 'Duration must be a positive number',
            timestamp: new Date().toISOString(),
            requestId: req.id || 'unknown'
          });
          return;
        }
        updateData.duration = parsedDuration;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields provided to update',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const service = await this.adminService.updateService(id, updateData);

      const response: ApiResponse = {
        success: true,
        message: 'Service updated successfully',
        data: service,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating service:', error);
      res.status(400).json({
        success: false,
        message: 'Error updating service',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Delete service
   * @route   DELETE /api/v1/admin-panel/services/:id
   * @access  Private/Admin
   */
  public deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Service ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      await this.adminService.deleteService(id);

      const response: ApiResponse = {
        success: true,
        message: 'Service deleted successfully',
        data: null,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting service:', error);
      res.status(400).json({
        success: false,
        message: 'Error deleting service',
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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Service ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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
        ...(minRating && { minRating: parseInt(minRating as string) }),
        ...(isVerified && { isVerified: isVerified === 'true' ? true : false })
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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Review ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Review ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

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
   * @desc    Get review details by ID
   * @route   GET /api/v1/admin-panel/reviews/:id
   * @access  Private/Admin
   */
  public getReviewDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Review ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const review = await this.adminService.getReviewDetails(id);

      const response: ApiResponse = {
        success: true,
        message: 'Review details retrieved successfully',
        data: review,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching review details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching review details',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Create new review
   * @route   POST /api/v1/admin-panel/reviews
   * @access  Private/Admin
   */
  public createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const reviewData = req.body;

      const review = await this.adminService.createReview(reviewData);

      const response: ApiResponse = {
        success: true,
        message: 'Review created successfully',
        data: review,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating review',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  };

  /**
   * @desc    Update review
   * @route   PUT /api/v1/admin-panel/reviews/:id
   * @access  Private/Admin
   */
  public updateReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reviewData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Review ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      const review = await this.adminService.updateReview(id, reviewData);

      const response: ApiResponse = {
        success: true,
        message: 'Review updated successfully',
        data: review,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating review',
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
   * @desc    Get revenue analytics by month
   * @route   GET /api/v1/admin-panel/analytics/revenue
   * @access  Private/Admin
   */
  public getRevenueAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { months = '12' } = req.query;
      const monthsCount = parseInt(months as string);

      const analytics = await this.adminService.getRevenueAnalytics(monthsCount);

      const response: ApiResponse = {
        success: true,
        message: 'Revenue analytics retrieved successfully',
        data: analytics,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error fetching revenue analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching revenue analytics',
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
