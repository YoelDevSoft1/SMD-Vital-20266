import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Sanitize string input to prevent XSS attacks
 */
const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query) as any;
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params) as any;
    }

    next();
  } catch (error: any) {
    logger.error('Sanitization error:', error);
    // Don't block the request if sanitization fails
    next();
  }
};

/**
 * Middleware to validate and sanitize email
 */
export const sanitizeEmail = (req: Request, res: Response, next: NextFunction): void => {
  const emailFields = ['email', 'fromEmail', 'toEmail'];

  for (const field of emailFields) {
    if (req.body[field]) {
      const email = req.body[field].toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: `Invalid email format: ${field}`,
          error: 'INVALID_EMAIL',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
        return;
      }

      req.body[field] = email;
    }
  }

  next();
};

/**
 * Middleware to sanitize phone numbers
 */
export const sanitizePhone = (req: Request, _res: Response, next: NextFunction): void => {
  const phoneFields = ['phone', 'emergencyPhone', 'phoneNumber'];

  for (const field of phoneFields) {
    if (req.body[field]) {
      // Remove all non-digit characters except +
      let phone = req.body[field].replace(/[^\d+]/g, '');

      // Ensure phone starts with + for international format
      if (phone && !phone.startsWith('+')) {
        // Assume Colombian number if no country code
        if (phone.startsWith('57')) {
          phone = '+' + phone;
        } else {
          phone = '+57' + phone;
        }
      }

      req.body[field] = phone;
    }
  }

  next();
};

/**
 * Middleware to prevent NoSQL injection
 */
export const preventNoSqlInjection = (req: Request, _res: Response, next: NextFunction): void => {
  const noSqlInjectionPatterns = [
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$gte/i,
    /\$lt/i,
    /\$lte/i,
    /\$in/i,
    /\$nin/i,
    /\$exists/i,
    /\$regex/i,
    /\$or/i,
    /\$and/i,
    /\$not/i,
    /\$nor/i
  ];

  const checkObject = (obj: any): boolean => {
    if (obj === null || obj === undefined) {
      return false;
    }

    if (typeof obj === 'string') {
      return noSqlInjectionPatterns.some(pattern => pattern.test(obj));
    }

    if (Array.isArray(obj)) {
      return obj.some(item => checkObject(item));
    }

    if (typeof obj === 'object') {
      // Check object keys
      const keys = Object.keys(obj);
      if (keys.some(key => key.startsWith('$'))) {
        return true;
      }

      // Check object values
      return Object.values(obj).some(value => checkObject(value));
    }

    return false;
  };

  try {
    const hasInjection = 
      checkObject(req.body) || 
      checkObject(req.query) || 
      checkObject(req.params);

    if (hasInjection) {
      logger.warn('NoSQL injection attempt detected', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });

      req.body = {};
      req.query = {};
      req.params = {};
    }

    next();
  } catch (error: any) {
    logger.error('NoSQL injection prevention error:', error);
    next();
  }
};

/**
 * Combined security middleware
 */
export const securityMiddleware = [
  preventNoSqlInjection,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone
];

