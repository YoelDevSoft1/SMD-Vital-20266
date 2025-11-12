import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create a rate limiter with custom options
 */
export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: Request) => req.ip || 'unknown'
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        key: keyGenerator(req)
      });

      res.status(429).json({
        success: false,
        message,
        error: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        requestId: req['id'] || 'unknown'
      });
    }
  });
};

/**
 * Rate limiters for different endpoints
 */
export const rateLimiters = {
  // Strict rate limiter for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
    skipSuccessfulRequests: true
  }),

  // Moderate rate limiter for API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests. Please slow down.'
  }),

  // Strict rate limiter for password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset attempts. Please try again later.',
    keyGenerator: (req: Request) => {
      // Rate limit by email if available, otherwise by IP
      const email = req.body?.['email'] || req.query?.['email'];
      return email ? `password-reset:${email}` : req.ip || 'unknown';
    }
  }),

  // Strict rate limiter for registration
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: 'Too many registration attempts. Please try again later.'
  }),

  // Moderate rate limiter for general endpoints
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: 'Too many requests. Please slow down.'
  }),

  // Strict rate limiter for payment endpoints
  payment: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 payment requests per 15 minutes
    message: 'Too many payment requests. Please try again later.'
  }),

  // Very strict rate limiter for admin endpoints
  admin: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    message: 'Too many admin requests. Please slow down.',
    keyGenerator: (req: Request) => {
      // Rate limit by user ID if authenticated, otherwise by IP
      // req.userId is set by auth middleware, so we can use it directly
      const userId = req.userId;
      return userId ? `admin:${userId}` : req.ip || 'unknown';
    }
  })
};

/**
 * Rate limiter based on user role
 */
export const roleBasedRateLimit = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 1000 // Very high limit for super admins
      });
    case 'ADMIN':
      return createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 500 // High limit for admins
      });
    case 'DOCTOR':
      return createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 200 // Moderate limit for doctors
      });
    case 'PATIENT':
    default:
      return createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 100 // Standard limit for patients
      });
  }
};

