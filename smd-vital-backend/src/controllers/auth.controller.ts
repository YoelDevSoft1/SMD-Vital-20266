import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validationSchemas } from '../types/validation';
import { ApiResponse, AuthResponse, RegisterRequest } from '../types';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @desc    Register a new user
   * @route   POST /api/v1/auth/register
   * @access  Public
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = validationSchemas.register.parse(req.body);
      
      // Register user
      const registerData = {
        ...validatedData,
        phone: validatedData.phone || undefined
      } as RegisterRequest;
      const result = await this.authService.register(registerData);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'User registered successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown' || 'unknown'
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Registration failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown' || 'unknown'
      };

      res.status(400).json(response);
    }
  };

  /**
   * @desc    Login user
   * @route   POST /api/v1/auth/login
   * @access  Public
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = validationSchemas.login.parse(req.body);
      
      // Login user
      const result = await this.authService.login(validatedData);
      
      // Debug logging
      logger.info('Login response - Token generated:', {
        tokenLength: result.accessToken.length,
        tokenStart: result.accessToken.substring(0, 20) + '...',
        tokenEnd: '...' + result.accessToken.substring(result.accessToken.length - 20),
        isJWTFormat: result.accessToken.split('.').length === 3
      });
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Login successful',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Login error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Login failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(401).json(response);
    }
  };

  /**
   * @desc    Refresh access token
   * @route   POST /api/v1/auth/refresh
   * @access  Public
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = validationSchemas.refreshToken.parse(req.body);
      
      // Refresh token
      const result = await this.authService.refreshToken(validatedData.refreshToken);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'Token refreshed successfully',
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Token refresh failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(401).json(response);
    }
  };

  /**
   * @desc    Logout user
   * @route   POST /api/v1/auth/logout
   * @access  Private
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      
      // Logout user
      await this.authService.logout(userId!);
      
      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Logout error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Logout failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(500).json(response);
    }
  };

  /**
   * @desc    Get current user profile
   * @route   GET /api/v1/auth/me
   * @access  Private
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      
      // Get user profile
      const user = await this.authService.getProfile(userId!);
      
      const response: ApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Get profile error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to get profile',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(500).json(response);
    }
  };

  /**
   * @desc    Update user profile
   * @route   PUT /api/v1/auth/profile
   * @access  Private
   */
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const validatedData = validationSchemas.updateUser.parse(req.body);
      
      // Update user profile
      const user = await this.authService.updateProfile(userId!, validatedData);
      
      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: user,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Update profile error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to update profile',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };

  /**
   * @desc    Change password
   * @route   PUT /api/v1/auth/change-password
   * @access  Private
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;
      
      // Validate passwords
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }
      
      validationSchemas.password.parse(newPassword);
      
      // Change password
      await this.authService.changePassword(userId!, currentPassword, newPassword);
      
      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Change password error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to change password',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };

  /**
   * @desc    Request password reset
   * @route   POST /api/v1/auth/forgot-password
   * @access  Public
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new Error('Email is required');
      }
      
      validationSchemas.email.parse(email);
      
      // Send password reset email
      await this.authService.forgotPassword(email);
      
      const response: ApiResponse = {
        success: true,
        message: 'Password reset email sent successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to send password reset email',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };

  /**
   * @desc    Reset password
   * @route   POST /api/v1/auth/reset-password
   * @access  Public
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new Error('Token and new password are required');
      }
      
      validationSchemas.password.parse(newPassword);
      
      // Reset password
      await this.authService.resetPassword(token, newPassword);
      
      const response: ApiResponse = {
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Reset password error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: error.message || 'Failed to reset password',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };
}

