import { Request, Response, NextFunction } from 'express';
// import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
        requestId: req.id || 'unknown',
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  let statusCode = 500;
  let message = 'Internal server error';
  let errorDetails: any = undefined;

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        errorDetails = {
          code: 'DUPLICATE_RECORD',
          fields: error.meta?.target
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        errorDetails = {
          code: 'RECORD_NOT_FOUND'
        };
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference to related record';
        errorDetails = {
          code: 'FOREIGN_KEY_CONSTRAINT'
        };
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid relation operation';
        errorDetails = {
          code: 'INVALID_RELATION'
        };
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
        errorDetails = {
          code: 'DATABASE_ERROR',
          prismaCode: error.code
        };
    }
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
    errorDetails = {
      code: 'VALIDATION_ERROR'
    };
  } else if (error.name === 'PrismaClientInitializationError') {
    statusCode = 503;
    message = 'Database connection failed';
    errorDetails = {
      code: 'DATABASE_CONNECTION_ERROR'
    };
  } else if (error.name === 'PrismaClientRustPanicError') {
    statusCode = 503;
    message = 'Database engine error';
    errorDetails = {
      code: 'DATABASE_ENGINE_ERROR'
    };
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorDetails = {
      code: 'INVALID_TOKEN'
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    errorDetails = {
      code: 'TOKEN_EXPIRED'
    };
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorDetails = {
      code: 'VALIDATION_ERROR',
      details: error.details
    };
  }
  // Handle custom API errors
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    errorDetails = error.details;
  }
  // Handle file upload errors
  else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    errorDetails = {
      code: 'FILE_TOO_LARGE',
      maxSize: '10MB'
    };
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    errorDetails = {
      code: 'UNEXPECTED_FILE_FIELD'
    };
  }
  // Handle rate limiting errors
  else if (error.status === 429) {
    statusCode = 429;
    message = 'Too many requests';
    errorDetails = {
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: error.retryAfter
    };
  }

  const response: ApiResponse = {
    success: false,
    message,
    error: errorDetails,
    timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
  };

  // Don't expose internal errors in production
  if (process.env['NODE_ENV'] === 'production' && statusCode === 500) {
    response.message = 'Internal server error';
    response.error = undefined as any;
  }

  res.status(statusCode).json(response);
};
