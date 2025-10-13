import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types';
import { EmailService } from './email.service';
import { RedisService } from './redis.service';

const prisma = new PrismaClient();

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   */
  public async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if phone is provided and unique
      if (data.phone) {
        const existingPhone = await prisma.user.findUnique({
          where: { phone: data.phone }
        });

        if (existingPhone) {
          throw new Error('User with this phone number already exists');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, config.security.bcryptRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          role: data.role || 'PATIENT'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Send verification email
      if (config.email.smtp.host) {
        try {
          await this.emailService.sendVerificationEmail(user.email, user.firstName);
        } catch (error) {
          logger.warn('Failed to send verification email:', error);
        }
      }

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user,
        ...tokens
      };
    } catch (error: any) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  public async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        ...tokens
      };
    } catch (error: any) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      // Check if refresh token exists in Redis
      const storedToken = await RedisService.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        user,
        ...tokens
      };
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(userId: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      await RedisService.del(`refresh_token:${userId}`);
      
      logger.info('User logged out successfully', { userId });
    } catch (error: any) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  public async getProfile(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          patient: {
            select: {
              id: true,
              dateOfBirth: true,
              gender: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              emergencyContact: true,
              emergencyPhone: true,
              medicalHistory: true,
              allergies: true,
              medications: true,
              insuranceNumber: true,
              insuranceProvider: true
            }
          },
          doctor: {
            select: {
              id: true,
              licenseNumber: true,
              specialty: true,
              experience: true,
              rating: true,
              totalReviews: true,
              isAvailable: true,
              consultationFee: true,
              bio: true,
              education: true,
              certifications: true,
              languages: true,
              serviceAreas: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error: any) {
      logger.error('Get profile failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(userId: string, data: any): Promise<any> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          avatar: data.avatar
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          avatar: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info('Profile updated successfully', { userId });

      return user;
    } catch (error: any) {
      logger.error('Update profile failed:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      logger.info('Password changed successfully', { userId });
    } catch (error: any) {
      logger.error('Change password failed:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   */
  public async forgotPassword(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // Store reset token in Redis
      await RedisService.setex(`reset_token:${user.id}`, 3600, resetToken);

      // Send reset email
      if (config.email.smtp.host) {
        await this.emailService.sendPasswordResetEmail(email, user.firstName, resetToken);
      }

      logger.info('Password reset email sent', { userId: user.id, email });
    } catch (error: any) {
      logger.error('Forgot password failed:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Check if reset token exists in Redis
      const storedToken = await RedisService.get(`reset_token:${decoded.userId}`);
      if (!storedToken || storedToken !== token) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      });

      // Remove reset token from Redis
      await RedisService.del(`reset_token:${decoded.userId}`);

      logger.info('Password reset successfully', { userId: decoded.userId });
    } catch (error: any) {
      logger.error('Reset password failed:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    // Generate access token
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    } as jwt.SignOptions);

    // Store refresh token in Redis
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    await RedisService.setex(`refresh_token:${user.id}`, refreshTokenExpiry, refreshToken);

    // Calculate expiration time
    const expiresIn = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }
}

