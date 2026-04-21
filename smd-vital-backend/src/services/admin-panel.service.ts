import { logger } from '../utils/logger';
import { RedisService } from './redis.service';
import fs from 'fs';
import path from 'path';
import prismaClient from '../utils/prisma';
import {
  appointmentTimeToMinutes,
  buildSlots,
  extractCoordinates,
  formatDateOnly,
  getDayRange,
  hasAppointmentConflict,
  haversineDistanceKm,
  isInsideAvailability,
  validateTimeRange
} from '../utils/scheduling';

const prisma = prismaClient;

export class AdminPanelService {
  /**
   * Get dashboard statistics
   */
  public async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPayments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        activeUsers,
        verifiedDoctors,
        totalRevenue,
        monthlyRevenue,
        avgRating,
        recentAppointments,
        recentUsers,
        topDoctors,
        popularServices
      ] = await Promise.all([
        // Total counts
        prisma.user.count(),
        prisma.patient.count(),
        prisma.doctor.count(),
        prisma.appointment.count(),
        prisma.payment.count(),

        // Appointment stats
        prisma.appointment.count({ where: { status: 'PENDING' } }),
        prisma.appointment.count({ where: { status: 'COMPLETED' } }),
        prisma.appointment.count({ where: { status: 'CANCELLED' } }),

        // User stats
        prisma.user.count({ where: { isActive: true } }),
        prisma.doctor.count({ where: { isAvailable: true } }),

        // Revenue stats
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { amount: true }
        }),

        // Average rating
        prisma.review.aggregate({
          _avg: { rating: true }
        }),

        // Recent data
        prisma.appointment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            doctor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            service: true
          }
        }),

        prisma.user.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        }),

        // Top doctors by appointments
        prisma.doctor.findMany({
          take: 5,
          orderBy: { rating: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
            _count: { select: { appointments: true } }
          }
        }),

        // Popular services
        prisma.service.findMany({
          take: 5,
          include: {
            _count: { select: { appointments: true } }
          },
          orderBy: {
            appointments: {
              _count: 'desc'
            }
          }
        })
      ]);

      // Calculate growth rates (compared to last month)
      const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
      const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const [lastMonthAppointments, thisMonthAppointments, lastMonthUsers, thisMonthUsers] = await Promise.all([
        prisma.appointment.count({
          where: {
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
          }
        }),
        prisma.appointment.count({
          where: {
            createdAt: { gte: thisMonthStart }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: thisMonthStart }
          }
        })
      ]);

      const appointmentGrowth = lastMonthAppointments > 0
        ? ((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100
        : 0;

      const userGrowth = lastMonthUsers > 0
        ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
        : 0;

      return {
        overview: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalAppointments,
          totalPayments,
          activeUsers,
          verifiedDoctors,
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          averageRating: avgRating._avg.rating || 0
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0
        },
        growth: {
          appointments: appointmentGrowth,
          users: userGrowth
        },
        recentActivity: {
          appointments: recentAppointments,
          users: recentUsers
        },
        topPerformers: {
          doctors: topDoctors,
          services: popularServices
        }
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get advanced analytics
   */
  public async getAnalytics(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    try {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      // Get appointments trend
      const appointments = await prisma.appointment.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          createdAt: true,
          status: true,
          totalPrice: true
        }
      });

      // Get revenue trend
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        select: {
          createdAt: true,
          amount: true,
          method: true
        }
      });

      // Get user registrations trend
      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          createdAt: true,
          role: true
        }
      });

      // Group data by time period
      const groupedData = this.groupDataByPeriod(
        { appointments, payments, users },
        params.groupBy || 'day'
      );

      return {
        period: {
          start: startDate,
          end: endDate,
          groupBy: params.groupBy || 'day'
        },
        trends: groupedData,
        summary: {
          totalAppointments: appointments.length,
          totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
          totalUsers: users.length,
          averageOrderValue: appointments.length > 0
            ? appointments.reduce((sum, a) => sum + a.totalPrice, 0) / appointments.length
            : 0
        }
      };
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue report
   */
  public async getRevenueReport(startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const [payments, paymentsByMethod, paymentsByStatus, topServices] = await Promise.all([
        // All payments
        prisma.payment.findMany({
          where: {
            createdAt: { gte: start, lte: end }
          },
          include: {
            appointment: {
              include: {
                service: true,
                doctor: { include: { user: true } }
              }
            }
          }
        }),

        // Payments by method
        prisma.payment.groupBy({
          by: ['method'],
          where: {
            createdAt: { gte: start, lte: end },
            status: 'COMPLETED'
          },
          _sum: { amount: true },
          _count: true
        }),

        // Payments by status
        prisma.payment.groupBy({
          by: ['status'],
          where: {
            createdAt: { gte: start, lte: end }
          },
          _sum: { amount: true },
          _count: true
        }),

        // Top services by revenue
        prisma.appointment.groupBy({
          by: ['serviceId'],
          where: {
            createdAt: { gte: start, lte: end },
            status: 'COMPLETED'
          },
          _sum: { totalPrice: true },
          _count: true,
          orderBy: {
            _sum: {
              totalPrice: 'desc'
            }
          },
          take: 10
        })
      ]);

      const totalRevenue = payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingRevenue = payments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        period: { start, end },
        summary: {
          totalRevenue,
          pendingRevenue,
          completedPayments: payments.filter(p => p.status === 'COMPLETED').length,
          pendingPayments: payments.filter(p => p.status === 'PENDING').length,
          failedPayments: payments.filter(p => p.status === 'FAILED').length
        },
        byMethod: paymentsByMethod,
        byStatus: paymentsByStatus,
        topServices,
        recentPayments: payments.slice(0, 20)
      };
    } catch (error) {
      logger.error('Error getting revenue report:', error);
      throw error;
    }
  }

  /**
   * Get users with filters
   */
  public async getUsers(filters: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.role) where.role = filters.role;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { createdAt: 'desc' },
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
            _count: {
              select: {
                notifications: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      return {
        data: users,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.page * filters.limit < total,
          hasPrev: filters.page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  public async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
  }) {
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone ?? null,
          role: userData.role as any,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
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
          updatedAt: true,
        }
      });

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  public async updateUser(id: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
  }) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone ?? null,
          role: userData.role as any,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
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
          updatedAt: true,
        }
      });

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  public async deleteUser(id: string) {
    try {
      await prisma.user.delete({
        where: { id }
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== DOCTORS ====================

  /**
   * Get all doctors with filters
   */
  public async getDoctors(filters: {
    page: number;
    limit: number;
    search?: string;
    specialty?: string;
    isAvailable?: boolean;
    rating?: number;
    experience?: number;
  }) {
    try {
      const { page, limit, search, specialty, isAvailable, rating, experience } = filters;
      const skip = (page - 1) * limit;

      const where: any = {
        user: {
          role: 'DOCTOR'
        }
      };

      if (search) {
        where.OR = [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { licenseNumber: { contains: search, mode: 'insensitive' } },
          { specialty: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (specialty) {
        where.specialty = specialty;
      }

      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
      }

      if (rating) {
        where.rating = { gte: rating };
      }

      if (experience) {
        where.experience = { gte: experience };
      }

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: true,
            _count: {
              select: {
                appointments: true,
                reviews: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.doctor.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: doctors,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting doctors:', error);
      throw error;
    }
  }

  /**
   * Create new doctor
   */
  public async createDoctor(doctorData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    licenseNumber: string;
    specialty: string;
    experience: number;
    consultationFee: number;
    bio?: string;
    isAvailable: boolean;
  }) {
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(doctorData.password, 12);

      // Create user first
      const user = await prisma.user.create({
        data: {
          email: doctorData.email,
          password: hashedPassword,
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: doctorData.phone ?? null,
          role: 'DOCTOR',
          isActive: true,
          isVerified: false,
        }
      });

      // Create doctor profile
      const doctor = await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: doctorData.licenseNumber,
          specialty: doctorData.specialty,
          experience: doctorData.experience,
          consultationFee: doctorData.consultationFee,
          bio: doctorData.bio ?? null,
          isAvailable: doctorData.isAvailable,
          rating: 0,
          totalReviews: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              isVerified: true,
              avatar: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          _count: {
            select: {
              appointments: true,
              reviews: true
            }
          }
        }
      });

      return doctor;
    } catch (error) {
      logger.error('Error creating doctor:', error);
      throw error;
    }
  }

  /**
   * Update doctor
   */
  public async updateDoctor(id: string, doctorData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    licenseNumber: string;
    specialty: string;
    experience: number;
    consultationFee: number;
    bio?: string;
    isAvailable: boolean;
  }) {
    try {
      // First get the doctor to get the userId
      const existingDoctor = await prisma.doctor.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingDoctor) {
        throw new Error('Doctor not found');
      }

      // Update user data
      await prisma.user.update({
        where: { id: existingDoctor.userId },
        data: {
          email: doctorData.email,
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: doctorData.phone ?? null,
        }
      });

      // Update doctor data
      const doctor = await prisma.doctor.update({
        where: { id },
        data: {
          licenseNumber: doctorData.licenseNumber,
          specialty: doctorData.specialty,
          experience: doctorData.experience,
          consultationFee: doctorData.consultationFee,
          bio: doctorData.bio ?? null,
          isAvailable: doctorData.isAvailable,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              isVerified: true,
              avatar: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          _count: {
            select: {
              appointments: true,
              reviews: true
            }
          }
        }
      });

      return doctor;
    } catch (error) {
      logger.error('Error updating doctor:', error);
      throw error;
    }
  }

  /**
   * Update doctor availability
   */
  public async updateDoctorAvailability(id: string, isAvailable: boolean) {
    try {
      await prisma.doctor.update({
        where: { id },
        data: { isAvailable }
      });

      return { message: 'Doctor availability updated successfully' };
    } catch (error) {
      logger.error('Error updating doctor availability:', error);
      throw error;
    }
  }

  public async getDoctorDailyAvailability(doctorId: string, date: string, duration = 60) {
    try {
      const { start, end, dateOnly } = getDayRange(date);
      const [doctor, availability, appointments] = await Promise.all([
        prisma.doctor.findUnique({
          where: { id: doctorId },
          include: { user: true }
        }),
        prisma.doctorAvailability.findMany({
          where: {
            doctorId,
            date: dateOnly,
            isActive: true
          },
          orderBy: { startTime: 'asc' }
        }),
        prisma.appointment.findMany({
          where: {
            doctorId,
            scheduledAt: { gte: start, lt: end },
            status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] }
          },
          orderBy: { scheduledAt: 'asc' },
          include: {
            patient: { include: { user: true } },
            service: true
          }
        })
      ]);

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const slots = buildSlots(availability, appointments, duration);

      return {
        doctor,
        date: formatDateOnly(dateOnly),
        availability,
        appointments,
        slots
      };
    } catch (error) {
      logger.error('Error getting doctor daily availability:', error);
      throw error;
    }
  }

  public async getDoctorDailyRoute(doctorId: string, date: string) {
    try {
      const { start, end, dateOnly } = getDayRange(date);
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledAt: { gte: start, lt: end },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] }
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          service: true
        }
      });

      const stops = appointments.map((appointment, index) => ({
        appointment,
        order: index + 1,
        coordinates: extractCoordinates(appointment.coordinates)
      }));

      const segments = [];
      for (let index = 0; index < stops.length - 1; index += 1) {
        const current = stops[index];
        const next = stops[index + 1];
        if (!current?.coordinates || !next?.coordinates) {
          segments.push({
            fromAppointmentId: current?.appointment.id,
            toAppointmentId: next?.appointment.id,
            distanceKm: null,
            estimatedTravelMinutes: null,
            availableMinutes: null,
            status: 'MISSING_COORDINATES'
          });
          continue;
        }

        const distanceKm = haversineDistanceKm(current.coordinates, next.coordinates);
        const estimatedTravelMinutes = Math.ceil((distanceKm / 25) * 60) + 10;
        const currentEnd = current.appointment.scheduledAt.getTime() + current.appointment.duration * 60 * 1000;
        const availableMinutes = Math.floor((next.appointment.scheduledAt.getTime() - currentEnd) / 60000);
        const status = availableMinutes < 0
          ? 'CONFLICT'
          : availableMinutes < estimatedTravelMinutes
            ? 'RISK'
            : 'OK';

        segments.push({
          fromAppointmentId: current.appointment.id,
          toAppointmentId: next.appointment.id,
          distanceKm: Number(distanceKm.toFixed(2)),
          estimatedTravelMinutes,
          availableMinutes,
          status
        });
      }

      return {
        date: formatDateOnly(dateOnly),
        appointments,
        stops,
        segments
      };
    } catch (error) {
      logger.error('Error getting doctor daily route:', error);
      throw error;
    }
  }

  /**
   * Update doctor media (logo and signature)
   */
  public async updateDoctorMedia(id: string, mediaData: {
    logoPath?: string;
    signaturePath?: string;
  }) {
    try {
      const updateData: any = {};

      if (mediaData.logoPath !== undefined) {
        updateData.logoPath = mediaData.logoPath;
      }

      if (mediaData.signaturePath !== undefined) {
        updateData.signaturePath = mediaData.signaturePath;
      }

      const doctor = await prisma.doctor.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      return doctor;
    } catch (error) {
      logger.error('Error updating doctor media:', error);
      throw error;
    }
  }

  /**
   * Delete doctor
   */
  public async deleteDoctor(id: string) {
    try {
      // First get the doctor to get the userId
      const doctor = await prisma.doctor.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Delete doctor profile first
      await prisma.doctor.delete({
        where: { id }
      });

      // Delete user
      await prisma.user.delete({
        where: { id: doctor.userId }
      });

      return { message: 'Doctor deleted successfully' };
    } catch (error) {
      logger.error('Error deleting doctor:', error);
      throw error;
    }
  }

  /**
   * Get user details
   */
  public async getUserDetails(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patient: {
            include: {
              appointments: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                  doctor: { include: { user: true } },
                  service: true
                }
              },
              reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                  doctor: { include: { user: true } }
                }
              },
              _count: {
                select: {
                  appointments: true,
                  reviews: true
                }
              }
            }
          },
          doctor: {
            include: {
              appointments: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                  patient: { include: { user: true } },
                  service: true
                }
              },
              reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                  patient: { include: { user: true } }
                }
              },
              schedules: true,
              services: { include: { service: true } },
              _count: {
                select: {
                  appointments: true,
                  reviews: true
                }
              }
            }
          },
          notifications: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error getting user details:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  public async updateUserStatus(userId: string, isActive: boolean) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          role: true
        }
      });

      logger.info(`User ${userId} status updated to ${isActive ? 'active' : 'inactive'}`);

      return user;
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Verify user
   */
  public async verifyUser(userId: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          role: true
        }
      });

      logger.info(`User ${userId} verified`);

      return user;
    } catch (error) {
      logger.error('Error verifying user:', error);
      throw error;
    }
  }


  /**
   * Get appointments with filters
   */
  public async getAppointments(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    doctorId?: string;
    patientId?: string;
    serviceId?: string;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.doctorId) where.doctorId = filters.doctorId;
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.serviceId) where.serviceId = filters.serviceId;

      if (filters.search) {
        where.OR = [
          { patient: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
          { patient: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
          { patient: { user: { email: { contains: filters.search, mode: 'insensitive' } } } },
          { doctor: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
          { doctor: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
          { doctor: { user: { email: { contains: filters.search, mode: 'insensitive' } } } },
          { address: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        where.scheduledAt = {};
        if (filters.dateFrom) where.scheduledAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.scheduledAt.lte = new Date(filters.dateTo);
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { scheduledAt: 'desc' },
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true
                  }
                }
              }
            },
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true
                  }
                }
              }
            },
            assignedNurse: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            },
            service: true,
            payments: true
          }
        }),
        prisma.appointment.count({ where })
      ]);

      return {
        data: appointments,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.page * filters.limit < total,
          hasPrev: filters.page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment details by ID
   */
  public async getAppointmentDetails(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          service: true,
          payments: true,
          assignedNurse: true
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return appointment;
    } catch (error) {
      logger.error('Error getting appointment details:', error);
      throw error;
    }
  }

  /**
   * Create new appointment
   */
  public async createAppointment(data: any) {
    try {
      await this.ensureAppointmentCanBeScheduled({
        doctorId: data.doctorId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration
      });

      const appointment = await prisma.appointment.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          serviceId: data.serviceId,
          status: data.status || 'PENDING',
          scheduledAt: new Date(data.scheduledAt),
          duration: data.duration,
          notes: data.notes ?? null,
          diagnosis: data.diagnosis ?? null,
          prescription: data.prescription ?? null,
          totalPrice: data.totalPrice,
          address: data.address,
          city: data.city,
          coordinates: data.coordinates ?? null,
          assignedNurseId: data.assignedNurseId ?? null
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          service: true,
          assignedNurse: true
        }
      });

      logger.info(`Appointment created: ${appointment.id}`);

      return appointment;
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Update appointment
   */
  public async updateAppointment(appointmentId: string, data: any) {
    try {
      const currentAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!currentAppointment) {
        throw new Error('Appointment not found');
      }

      await this.ensureAppointmentCanBeScheduled({
        doctorId: data.doctorId ?? currentAppointment.doctorId,
        scheduledAt: data.scheduledAt !== undefined ? new Date(data.scheduledAt) : currentAppointment.scheduledAt,
        duration: data.duration ?? currentAppointment.duration,
        ignoreAppointmentId: appointmentId
      });

      const updateData: any = {};

      // Only update fields that are allowed to be updated
      if (data.status !== undefined) updateData.status = data.status;
      if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.notes !== undefined) updateData.notes = data.notes ?? null;
      if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis ?? null;
      if (data.prescription !== undefined) updateData.prescription = data.prescription ?? null;
      if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.coordinates !== undefined) updateData.coordinates = data.coordinates ?? null;
      if (data.assignedNurseId !== undefined) updateData.assignedNurseId = data.assignedNurseId ?? null;

      // For relationship fields, we need to use connect
      if (data.patientId !== undefined) {
        updateData.patient = { connect: { id: data.patientId } };
      }
      if (data.doctorId !== undefined) {
        updateData.doctor = { connect: { id: data.doctorId } };
      }
      if (data.serviceId !== undefined) {
        updateData.service = { connect: { id: data.serviceId } };
      }

      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          service: true,
          assignedNurse: true
        }
      });

      logger.info(`Appointment updated: ${appointmentId}`);

      return appointment;
    } catch (error) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  public async updateAppointmentStatus(appointmentId: string, status: string) {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: status as any },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          service: true
        }
      });

      logger.info(`Appointment ${appointmentId} status updated to ${status}`);

      return appointment;
    } catch (error) {
      logger.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Delete appointment
   */
  public async deleteAppointment(appointmentId: string) {
    try {
      await prisma.appointment.delete({
        where: { id: appointmentId }
      });

      logger.info(`Appointment deleted: ${appointmentId}`);
    } catch (error) {
      logger.error('Error deleting appointment:', error);
      throw error;
    }
  }

  public async createQuickPatient(data: {
    firstName: string;
    lastName: string;
    documentId: string;
    phone: string;
  }) {
    const bcrypt = require('bcryptjs');
    const placeholderEmail = `${data.documentId.toLowerCase().replace(/\s+/g, '')}@paciente.smdvital.temp`;
    const hashedPassword = await bcrypt.hash(data.documentId, 12);

    const existingPatient = await prisma.patient.findFirst({
      where: { user: { email: placeholderEmail } },
      include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    });
    if (existingPatient) return existingPatient;

    return prisma.patient.create({
      data: {
        insuranceNumber: data.documentId,
        user: {
          create: {
            email: placeholderEmail,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
            role: 'PATIENT',
            isActive: true,
            isVerified: false,
            isPlaceholder: true,
          },
        },
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    });
  }

  /**
   * Get all patients with filters
   */
  public async getPatients(filters: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {
        user: {
          role: 'PATIENT'
        }
      };

      if (filters.search) {
        where.OR = [
          { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          { user: { email: { contains: filters.search, mode: 'insensitive' } } }
        ];
      }

      if (filters.isActive !== undefined) {
        where.user.isActive = filters.isActive;
      }

      if (filters.isVerified !== undefined) {
        where.user.isVerified = filters.isVerified;
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          skip,
          take: filters.limit,
          include: {
            user: true,
            _count: {
              select: {
                appointments: true,
                medicalRecords: true,
                prescriptions: true,
                reviews: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.patient.count({ where })
      ]);

      const totalPages = Math.ceil(total / filters.limit);

      return {
        data: patients,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
          hasNext: filters.page < totalPages,
          hasPrev: filters.page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting patients:', error);
      throw error;
    }
  }

  /**
   * Get payments with filters
   */
  public async getPayments(filters: {
    page: number;
    limit: number;
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.method) where.method = filters.method;

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            appointment: {
              include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
                service: true
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return {
        data: payments,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.page * filters.limit < total,
          hasPrev: filters.page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting payments:', error);
      throw error;
    }
  }

  /**
   * Get payment details by ID
   */
  public async getPaymentDetails(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          appointment: {
            include: {
              patient: { include: { user: true } },
              doctor: { include: { user: true } },
              service: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      logger.error('Error getting payment details:', error);
      throw error;
    }
  }

  /**
   * Create new payment
   */
  public async createPayment(data: any) {
    try {
      const payment = await prisma.payment.create({
        data: {
          appointmentId: data.appointmentId,
          amount: data.amount,
          currency: data.currency || 'COP',
          status: data.status || 'PENDING',
          method: data.method,
          transactionId: data.transactionId ?? null,
          stripePaymentIntentId: data.stripePaymentIntentId ?? null
        },
        include: {
          appointment: {
            include: {
              patient: { include: { user: true } },
              doctor: { include: { user: true } },
              service: true
            }
          }
        }
      });

      logger.info(`Payment created: ${payment.id}`);

      return payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Update payment
   */
  public async updatePayment(paymentId: string, data: any) {
    try {
      const updateData: any = {};

      // Only update fields that are allowed to be updated
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.method !== undefined) updateData.method = data.method;
      if (data.transactionId !== undefined) updateData.transactionId = data.transactionId ?? null;
      if (data.stripePaymentIntentId !== undefined) updateData.stripePaymentIntentId = data.stripePaymentIntentId ?? null;

      // For relationship fields, we need to use connect
      if (data.appointmentId !== undefined) {
        updateData.appointment = { connect: { id: data.appointmentId } };
      }

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          appointment: {
            include: {
              patient: { include: { user: true } },
              doctor: { include: { user: true } },
              service: true
            }
          }
        }
      });

      logger.info(`Payment updated: ${paymentId}`);

      return payment;
    } catch (error) {
      logger.error('Error updating payment:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  public async updatePaymentStatus(paymentId: string, status: string) {
    try {
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: status as any },
        include: {
          appointment: {
            include: {
              patient: { include: { user: true } },
              doctor: { include: { user: true } },
              service: true
            }
          }
        }
      });

      logger.info(`Payment status updated: ${paymentId} to ${status}`);

      return payment;
    } catch (error) {
      logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Delete payment
   */
  public async deletePayment(paymentId: string) {
    try {
      await prisma.payment.delete({
        where: { id: paymentId }
      });

      logger.info(`Payment deleted: ${paymentId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting payment:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics by month
   */
  public async getRevenueAnalytics(monthsCount: number = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsCount + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      // Obtener pagos completados en el rango de fechas
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          amount: true,
          createdAt: true,
          method: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Agrupar por mes
      const monthlyData = new Map();
      const methodData = new Map();

      // Inicializar meses
      for (let i = 0; i < monthsCount; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - monthsCount + 1 + i);
        date.setDate(1);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        
        monthlyData.set(monthKey, {
          month: monthName,
          revenue: 0,
          count: 0
        });
      }

      // Procesar pagos
      payments.forEach(payment => {
        const monthKey = payment.createdAt.toISOString().substring(0, 7);
        const monthData = monthlyData.get(monthKey);
        
        if (monthData) {
          monthData.revenue += payment.amount;
          monthData.count += 1;
        }

        // Contar métodos de pago
        const method = payment.method;
        methodData.set(method, (methodData.get(method) || 0) + 1);
      });

      // Convertir a arrays para el frontend
      const revenueData = {
        labels: Array.from(monthlyData.values()).map(data => data.month),
        datasets: [
          {
            label: 'Ingresos (COP)',
            data: Array.from(monthlyData.values()).map(data => data.revenue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };

      const paymentMethodsData = {
        labels: Array.from(methodData.keys()).map(method => {
          const translations: { [key: string]: string } = {
            'CARD': 'Tarjeta',
            'BANK_TRANSFER': 'Transferencia',
            'NEQUI': 'Nequi',
            'DAVIPLATA': 'Davivienda',
            'PSE': 'PSE',
            'CASH': 'Efectivo'
          };
          return translations[method] || method;
        }),
        datasets: [
          {
            label: 'Cantidad de Pagos',
            data: Array.from(methodData.values()),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(107, 114, 128, 0.8)',
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(168, 85, 247)',
              'rgb(249, 115, 22)',
              'rgb(239, 68, 68)',
              'rgb(107, 114, 128)',
            ],
            borderWidth: 1,
          },
        ],
      };

      return {
        revenue: revenueData,
        paymentMethods: paymentMethodsData,
        summary: {
          totalRevenue: Array.from(monthlyData.values()).reduce((sum, data) => sum + data.revenue, 0),
          totalPayments: Array.from(monthlyData.values()).reduce((sum, data) => sum + data.count, 0),
          averageMonthlyRevenue: Array.from(monthlyData.values()).reduce((sum, data) => sum + data.revenue, 0) / monthsCount,
        }
      };
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get services with filters
   */
  public async getServices(filters: {
    page: number;
    limit: number;
    category?: string;
    isActive?: boolean;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.category) where.category = filters.category;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                appointments: true,
                doctorServices: true
              }
            }
          }
        }),
        prisma.service.count({ where })
      ]);

      return {
        data: services,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.page * filters.limit < total,
          hasPrev: filters.page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting services:', error);
      throw error;
    }
  }

  /**
   * Get service details by ID
   */
  public async getServiceDetails(serviceId: string) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          _count: {
            select: {
              appointments: true,
              doctorServices: true
            }
          }
        }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      return service;
    } catch (error) {
      logger.error('Error fetching service details:', error);
      throw error;
    }
  }

  /**
   * Create new service
   */
  public async createService(data: {
    name: string;
    description: string;
    category: string;
    basePrice: number;
    duration: number;
    isActive?: boolean;
    requirements?: string | null;
  }) {
    try {
      const service = await prisma.service.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category as any,
          basePrice: data.basePrice,
          duration: data.duration,
          isActive: data.isActive ?? true,
          requirements: data.requirements ?? null
        },
        include: {
          _count: {
            select: {
              appointments: true,
              doctorServices: true
            }
          }
        }
      });

      logger.info(`Service created: ${service.id}`);

      return service;
    } catch (error) {
      logger.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update service
   */
  public async updateService(serviceId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    basePrice?: number;
    duration?: number;
    isActive?: boolean;
    requirements?: string | null;
  }) {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category as any;
      if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.requirements !== undefined) {
        updateData.requirements = data.requirements ? data.requirements : null;
      }

      const service = await prisma.service.update({
        where: { id: serviceId },
        data: updateData,
        include: {
          _count: {
            select: {
              appointments: true,
              doctorServices: true
            }
          }
        }
      });

      logger.info(`Service updated: ${serviceId}`);

      return service;
    } catch (error) {
      logger.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Delete service
   */
  public async deleteService(serviceId: string) {
    try {
      await prisma.service.delete({
        where: { id: serviceId }
      });

      logger.info(`Service deleted: ${serviceId}`);

      return true;
    } catch (error) {
      logger.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Update service status
   */
  public async updateServiceStatus(serviceId: string, isActive: boolean) {
    try {
      const service = await prisma.service.update({
        where: { id: serviceId },
        data: { isActive }
      });

      logger.info(`Service ${serviceId} status updated to ${isActive ? 'active' : 'inactive'}`);

      return service;
    } catch (error) {
      logger.error('Error updating service status:', error);
      throw error;
    }
  }

  /**
   * Get reviews with filters
   */
  public async getReviews(filters: {
    page: number;
    limit: number;
    doctorId?: string;
    minRating?: number;
    isVerified?: boolean;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.doctorId) where.doctorId = filters.doctorId;
      if (filters.minRating) where.rating = { gte: filters.minRating };
      if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            },
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            appointment: {
              select: {
                id: true,
                scheduledAt: true,
                status: true
              }
            }
          }
        }),
        prisma.review.count({ where })
      ]);

      return {
        data: reviews,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
          hasNext: filters.page * filters.limit < total,
          hasPrev: filters.page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting reviews:', error);
      throw error;
    }
  }

  /**
   * Verify review
   */
  public async verifyReview(reviewId: string) {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: { isVerified: true },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      });

      logger.info(`Review ${reviewId} verified`);

      return review;
    } catch (error) {
      logger.error('Error verifying review:', error);
      throw error;
    }
  }

  /**
   * Delete review
   */
  public async deleteReview(reviewId: string) {
    try {
      await prisma.review.delete({
        where: { id: reviewId }
      });

      logger.info(`Review ${reviewId} deleted`);
    } catch (error) {
      logger.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Get review details by ID
   */
  public async getReviewDetails(reviewId: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          appointment: {
            select: {
              id: true,
              scheduledAt: true,
              duration: true,
              status: true
            }
          }
        }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      return review;
    } catch (error) {
      logger.error('Error fetching review details:', error);
      throw error;
    }
  }

  /**
   * Create new review
   */
  public async createReview(reviewData: any) {
    try {
      const review = await prisma.review.create({
        data: {
          patientId: reviewData.patientId,
          doctorId: reviewData.doctorId,
          appointmentId: reviewData.appointmentId || null,
          rating: reviewData.rating,
          comment: reviewData.comment || null,
          isVerified: reviewData.isVerified || false
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          appointment: {
            select: {
              id: true,
              scheduledAt: true,
              duration: true,
              status: true
            }
          }
        }
      });

      logger.info(`Review created for patient ${reviewData.patientId} and doctor ${reviewData.doctorId}`);
      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Update review
   */
  public async updateReview(reviewId: string, reviewData: any) {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(reviewData.patientId && { patientId: reviewData.patientId }),
          ...(reviewData.doctorId && { doctorId: reviewData.doctorId }),
          ...(reviewData.appointmentId !== undefined && { appointmentId: reviewData.appointmentId }),
          ...(reviewData.rating !== undefined && { rating: reviewData.rating }),
          ...(reviewData.comment !== undefined && { comment: reviewData.comment }),
          ...(reviewData.isVerified !== undefined && { isVerified: reviewData.isVerified })
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          appointment: {
            select: {
              id: true,
              scheduledAt: true,
              duration: true,
              status: true
            }
          }
        }
      });

      logger.info(`Review ${reviewId} updated`);
      return review;
    } catch (error) {
      logger.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Get system health
   */
  public async getSystemHealth() {
    try {
      // Check database
      const dbStatus = await prisma.$queryRaw`SELECT 1 as status`;

      // Check Redis
      let redisStatus = 'disconnected';
      try {
        await RedisService.ping();
        redisStatus = 'connected';
      } catch (error) {
        logger.error('Redis health check failed:', error);
      }

      // System metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbStatus ? 'connected' : 'disconnected',
          redis: redisStatus
        },
        system: {
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            unit: 'MB'
          },
          cpu: {
            user: Math.round(cpuUsage.user / 1000),
            system: Math.round(cpuUsage.system / 1000),
            unit: 'microseconds'
          },
          platform: process.platform,
          nodeVersion: process.version
        }
      };
    } catch (error) {
      logger.error('Error checking system health:', error);
      throw error;
    }
  }


  /**
   * Get system logs
   */
  public async getSystemLogs(filters: {
    level?: string;
    limit: number;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const logsPath = path.join(process.cwd(), 'logs', 'combined.log');

      if (!fs.existsSync(logsPath)) {
        return { logs: [], message: 'No logs available' };
      }

      const logsContent = fs.readFileSync(logsPath, 'utf-8');
      const logLines = logsContent.split('\n').filter(line => line.trim());

      let filteredLogs = logLines;

      // Filter by level
      if (filters.level) {
        filteredLogs = filteredLogs.filter(line =>
          line.toLowerCase().includes(filters.level!.toLowerCase())
        );
      }

      // Filter by date range
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
        const end = filters.endDate ? new Date(filters.endDate) : new Date();

        filteredLogs = filteredLogs.filter(line => {
          const match = line.match(/\d{4}-\d{2}-\d{2}/);
          if (match) {
            const logDate = new Date(match[0]);
            return logDate >= start && logDate <= end;
          }
          return false;
        });
      }

      // Limit results
      const limitedLogs = filteredLogs.slice(-filters.limit);

      return {
        logs: limitedLogs.reverse(),
        total: filteredLogs.length,
        limit: filters.limit
      };
    } catch (error) {
      logger.error('Error getting system logs:', error);
      throw error;
    }
  }

  /**
   * Export data
   */
  public async exportData(type: string, format: string, filters: any) {
    try {
      let data: any;

      switch (type) {
        case 'users':
          data = await prisma.user.findMany({ where: filters });
          break;
        case 'appointments':
          data = await prisma.appointment.findMany({
            where: filters,
            include: {
              patient: { include: { user: true } },
              doctor: { include: { user: true } },
              service: true
            }
          });
          break;
        case 'payments':
          data = await prisma.payment.findMany({
            where: filters,
            include: { appointment: true }
          });
          break;
        default:
          throw new Error('Invalid export type');
      }

      logger.info(`Exported ${data.length} ${type} records in ${format} format`);

      return {
        type,
        format,
        count: data.length,
        data,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Helper: Group data by time period
   */
  private groupDataByPeriod(data: any, period: 'day' | 'week' | 'month') {
    // Implementation for grouping data by time periods
    // This is a simplified version - you can enhance it based on needs
    const grouped: any = {};

    data.appointments?.forEach((item: any) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0] ?? '';
      } else if (period === 'week') {
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0] ?? '';
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          appointments: 0,
          revenue: 0,
          users: 0
        };
      }

      grouped[key].appointments++;
    });

    data.payments?.forEach((item: any) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0] ?? '';
      } else if (period === 'week') {
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0] ?? '';
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          appointments: 0,
          revenue: 0,
          users: 0
        };
      }

      grouped[key].revenue += item.amount;
    });

    data.users?.forEach((item: any) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0] ?? '';
      } else if (period === 'week') {
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0] ?? '';
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          appointments: 0,
          revenue: 0,
          users: 0
        };
      }

      grouped[key].users++;
    });

    return Object.values(grouped);
  }

  private async ensureAppointmentCanBeScheduled(input: {
    doctorId: string;
    scheduledAt: Date;
    duration: number;
    ignoreAppointmentId?: string;
  }): Promise<void> {
    if (!input.doctorId) {
      throw new Error('Doctor is required');
    }

    if (Number.isNaN(input.scheduledAt.getTime())) {
      throw new Error('Invalid appointment date');
    }

    if (!input.duration || input.duration <= 0) {
      throw new Error('Appointment duration must be greater than zero');
    }

    const { start, end, dateOnly } = getDayRange(input.scheduledAt);
    const [availability, appointments] = await Promise.all([
      prisma.doctorAvailability.findMany({
        where: {
          doctorId: input.doctorId,
          date: dateOnly,
          isActive: true
        }
      }),
      prisma.appointment.findMany({
        where: {
          doctorId: input.doctorId,
          scheduledAt: { gte: start, lt: end },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] }
        },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
          status: true
        }
      })
    ]);

    if (availability.length === 0) {
      throw new Error('El medico no tiene disponibilidad registrada para ese dia');
    }

    availability.forEach(validateTimeRange);
    const appointmentStart = appointmentTimeToMinutes(input.scheduledAt);
    const appointmentEnd = appointmentStart + input.duration;

    if (!isInsideAvailability(appointmentStart, appointmentEnd, availability)) {
      throw new Error('La cita esta fuera del rango disponible del medico');
    }

    if (hasAppointmentConflict(appointmentStart, appointmentEnd, appointments, input.ignoreAppointmentId)) {
      throw new Error('El medico ya tiene una cita en ese horario');
    }
  }
}
