import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body, query, and params
      const validatedData = schema.parse({
        ...req.body,
        ...req.query,
        ...req.params
      });

      // Replace request data with validated data
      req.body = validatedData;
      
      next();
    } catch (error: any) {
      logger.error('Validation error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        error: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        })) || [error.message],
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };
};

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      logger.error('Body validation error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Request body validation failed',
        error: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        })) || [error.message],
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error: any) {
      logger.error('Query validation error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Query parameters validation failed',
        error: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        })) || [error.message],
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error: any) {
      logger.error('Params validation error:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'URL parameters validation failed',
        error: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        })) || [error.message],
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      };

      res.status(400).json(response);
    }
  };
};

