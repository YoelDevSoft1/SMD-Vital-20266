import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { RedisService } from './redis.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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
        users,
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
   * Delete user
   */
  public async deleteUser(userId: string) {
    try {
      await prisma.user.delete({
        where: { id: userId }
      });

      logger.info(`User ${userId} deleted`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get doctors with filters
   */
  public async getDoctors(filters: {
    page: number;
    limit: number;
    specialty?: string;
    isAvailable?: boolean;
    search?: string;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.specialty) where.specialty = filters.specialty;
      if (filters.isAvailable !== undefined) where.isAvailable = filters.isAvailable;

      if (filters.search) {
        where.user = {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        };
      }

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: { rating: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                isActive: true,
                isVerified: true
              }
            },
            _count: {
              select: {
                appointments: true,
                reviews: true
              }
            }
          }
        }),
        prisma.doctor.count({ where })
      ]);

      return {
        doctors,
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
      logger.error('Error getting doctors:', error);
      throw error;
    }
  }

  /**
   * Update doctor availability
   */
  public async updateDoctorAvailability(doctorId: string, isAvailable: boolean) {
    try {
      const doctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: { isAvailable },
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
      });

      logger.info(`Doctor ${doctorId} availability updated to ${isAvailable}`);

      return doctor;
    } catch (error) {
      logger.error('Error updating doctor availability:', error);
      throw error;
    }
  }

  /**
   * Get appointments with filters
   */
  public async getAppointments(filters: {
    page: number;
    limit: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    doctorId?: string;
    patientId?: string;
  }) {
    try {
      const skip = (filters.page - 1) * filters.limit;
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.doctorId) where.doctorId = filters.doctorId;
      if (filters.patientId) where.patientId = filters.patientId;

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
            service: true,
            payments: true
          }
        }),
        prisma.appointment.count({ where })
      ]);

      return {
        appointments,
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
        payments,
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
        services,
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
        reviews,
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
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0];
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
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0];
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
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        key = weekStart.toISOString().split('T')[0];
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
}
