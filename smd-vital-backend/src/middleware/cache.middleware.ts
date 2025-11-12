import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

/**
 * Middleware to cache HTTP GET responses
 * @param options Cache configuration options
 * @returns Express middleware function
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator = defaultKeyGenerator,
    condition = defaultCondition
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Check if caching should be applied
    if (!condition(req, res)) {
      next();
      return;
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator(req);

      // Try to get from cache
      const cachedData = await RedisService.get(cacheKey);

      if (cachedData) {
        logger.debug('Cache HIT', { key: cacheKey, path: req.path });
        
        const parsedData = JSON.parse(cachedData);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.status(200).json(parsedData);
        return;
      }

      // Cache MISS - proceed with request and cache response
      logger.debug('Cache MISS', { key: cacheKey, path: req.path });

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const dataToCache = JSON.stringify(body);
          
          // Set cache asynchronously (don't block response)
          RedisService.setex(cacheKey, ttl, dataToCache).catch((error) => {
            logger.error('Failed to cache response:', error);
          });
        }

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        return originalJson(body);
      };

      next();
    } catch (error: any) {
      // If cache fails, continue without caching
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Default cache key generator
 * Creates a key based on the request path, query parameters, and user ID (if authenticated)
 */
const defaultKeyGenerator = (req: Request): string => {
  const baseKey = `cache:${req.method}:${req.path}`;
  const queryString = req.query ? JSON.stringify(req.query) : '';
  const userId = req.userId || 'anonymous';
  
  // Create a hash-like key
  const keyParts = [baseKey, queryString, userId].filter(Boolean);
  return keyParts.join(':').replace(/[^a-zA-Z0-9:]/g, '_');
};

/**
 * Default condition for caching
 * Only cache if response is successful and not already cached
 */
const defaultCondition = (_req: Request, res: Response): boolean => {
  // Don't cache if response is already sent
  if (res.headersSent) {
    return false;
  }

  // Don't cache if explicitly disabled
  if (res.getHeader('X-Cache-Disable')) {
    return false;
  }

  return true;
};

/**
 * Middleware to invalidate cache by pattern
 * Useful for POST/PUT/DELETE operations
 */
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Invalidate cache after successful mutation operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        for (const pattern of patterns) {
          // Replace placeholders with actual values
          let cachePattern = pattern;
          
          if (req.userId) {
            cachePattern = cachePattern.replace(':userId', req.userId);
          }
          
          if (req.params && 'id' in req.params && req.params['id']) {
            cachePattern = cachePattern.replace(':id', String(req.params['id']));
          }

          // Invalidate all keys matching the pattern
          await RedisService.deletePattern(cachePattern);
          logger.debug('Cache invalidated', { pattern: cachePattern });
        }
      }

      next();
    } catch (error: any) {
      logger.error('Cache invalidation error:', error);
      // Don't block the request if cache invalidation fails
      next();
    }
  };
};

/**
 * Clear all cache (admin only)
 */
export const clearAllCache = async (_req: Request, res: Response): Promise<void> => {
  try {
    await RedisService.flushAll();
    res.json({
      success: true,
      message: 'All cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      timestamp: new Date().toISOString()
    });
  }
};

