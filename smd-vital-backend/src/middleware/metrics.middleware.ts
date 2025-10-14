import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';

const metricsService = MetricsService.getInstance();

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    metricsService.recordHttpRequest(method, route, statusCode, duration);

    // Call original end method
    return originalEnd(chunk, encoding, cb);
  };

  next();
};
