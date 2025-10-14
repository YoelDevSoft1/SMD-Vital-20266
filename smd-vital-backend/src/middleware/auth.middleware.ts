import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import prismaClient from '../utils/prisma';

const prisma = prismaClient;

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        message: 'Access token is required',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Debug logging
    logger.info('Auth middleware - Token received:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 20),
      isJWTFormat: token.split('.').length === 3
    });

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(401).json(response);
      return;
    }

    if (!user.isActive) {
      const response: ApiResponse = {
        success: false,
        message: 'User account is deactivated',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(401).json(response);
      return;
    }

    // Add user info to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error: any) {
    logger.error('Auth middleware error:', error);
    
    let message = 'Invalid token';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token format';
    }

    const response: ApiResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    res.status(401).json(response);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };
      res.status(403).json(response);
      return;
    }
    next();
  };
};

export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !('isVerified' in req.user) || !req.user.isVerified) {
    const response: ApiResponse = {
      success: false,
      message: 'Email verification required',
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };
    res.status(403).json(response);
    return;
  }
  next();
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

