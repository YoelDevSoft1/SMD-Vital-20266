import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.warn('Route not found:', {
    requestId: req.id || 'unknown',
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    error: JSON.stringify({
      code: 'ROUTE_NOT_FOUND',
      method: req.method,
      url: req.url,
      availableEndpoints: [
        'GET /health',
        'GET /api/docs',
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/refresh',
        'POST /api/v1/auth/logout',
        'GET /api/v1/auth/me',
        'PUT /api/v1/auth/profile',
        'PUT /api/v1/auth/change-password',
        'POST /api/v1/auth/forgot-password',
        'POST /api/v1/auth/reset-password'
      ]
    }),
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  res.status(404).json(response);
};

