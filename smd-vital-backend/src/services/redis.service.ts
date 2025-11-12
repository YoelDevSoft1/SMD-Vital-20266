import Redis from 'ioredis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class RedisService {
  private static client: Redis;

  /**
   * Initialize Redis connection
   */
  public static async initialize(): Promise<void> {
    if (this.client) {
      logger.info('Redis client already initialized');
      return;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // Handle connection events
      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Test connection
      await this.client.ping();
      logger.info('Redis connection test successful');
    } catch (error: any) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Get value by key
   */
  public static async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error: any) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  /**
   * Set key-value pair
   */
  public static async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (error: any) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  /**
   * Set key-value pair with expiration
   */
  public static async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await this.client.setex(key, seconds, value);
    } catch (error: any) {
      logger.error('Redis SETEX error:', error);
      throw error;
    }
  }

  /**
   * Delete key
   */
  public static async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  /**
   * Set expiration for key
   */
  public static async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error: any) {
      logger.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  /**
   * Get TTL for key
   */
  public static async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error: any) {
      logger.error('Redis TTL error:', error);
      throw error;
    }
  }

  /**
   * Increment value
   */
  public static async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error: any) {
      logger.error('Redis INCR error:', error);
      throw error;
    }
  }

  /**
   * Increment value by amount
   */
  public static async incrby(key: string, increment: number): Promise<number> {
    try {
      return await this.client.incrby(key, increment);
    } catch (error: any) {
      logger.error('Redis INCRBY error:', error);
      throw error;
    }
  }

  /**
   * Decrement value
   */
  public static async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error: any) {
      logger.error('Redis DECR error:', error);
      throw error;
    }
  }

  /**
   * Decrement value by amount
   */
  public static async decrby(key: string, decrement: number): Promise<number> {
    try {
      return await this.client.decrby(key, decrement);
    } catch (error: any) {
      logger.error('Redis DECRBY error:', error);
      throw error;
    }
  }

  /**
   * Get multiple keys
   */
  public static async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.client.mget(...keys);
    } catch (error: any) {
      logger.error('Redis MGET error:', error);
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs
   */
  public static async mset(keyValuePairs: Record<string, string>): Promise<void> {
    try {
      const args: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        args.push(key, value);
      }
      await this.client.mset(...args);
    } catch (error: any) {
      logger.error('Redis MSET error:', error);
      throw error;
    }
  }

  /**
   * Get hash field
   */
  public static async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error: any) {
      logger.error('Redis HGET error:', error);
      throw error;
    }
  }

  /**
   * Set hash field
   */
  public static async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(key, field, value);
    } catch (error: any) {
      logger.error('Redis HSET error:', error);
      throw error;
    }
  }

  /**
   * Get all hash fields
   */
  public static async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error: any) {
      logger.error('Redis HGETALL error:', error);
      throw error;
    }
  }

  /**
   * Delete hash field
   */
  public static async hdel(key: string, field: string): Promise<void> {
    try {
      await this.client.hdel(key, field);
    } catch (error: any) {
      logger.error('Redis HDEL error:', error);
      throw error;
    }
  }

  /**
   * Add to set
   */
  public static async sadd(key: string, member: string): Promise<void> {
    try {
      await this.client.sadd(key, member);
    } catch (error: any) {
      logger.error('Redis SADD error:', error);
      throw error;
    }
  }

  /**
   * Get set members
   */
  public static async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error: any) {
      logger.error('Redis SMEMBERS error:', error);
      throw error;
    }
  }

  /**
   * Remove from set
   */
  public static async srem(key: string, member: string): Promise<void> {
    try {
      await this.client.srem(key, member);
    } catch (error: any) {
      logger.error('Redis SREM error:', error);
      throw error;
    }
  }

  /**
   * Check if member exists in set
   */
  public static async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error: any) {
      logger.error('Redis SISMEMBER error:', error);
      throw error;
    }
  }

  /**
   * Add to list (left)
   */
  public static async lpush(key: string, value: string): Promise<void> {
    try {
      await this.client.lpush(key, value);
    } catch (error: any) {
      logger.error('Redis LPUSH error:', error);
      throw error;
    }
  }

  /**
   * Add to list (right)
   */
  public static async rpush(key: string, value: string): Promise<void> {
    try {
      await this.client.rpush(key, value);
    } catch (error: any) {
      logger.error('Redis RPUSH error:', error);
      throw error;
    }
  }

  /**
   * Get list range
   */
  public static async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error: any) {
      logger.error('Redis LRANGE error:', error);
      throw error;
    }
  }

  /**
   * Get list length
   */
  public static async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error: any) {
      logger.error('Redis LLEN error:', error);
      throw error;
    }
  }

  /**
   * Remove from list
   */
  public static async lrem(key: string, count: number, value: string): Promise<void> {
    try {
      await this.client.lrem(key, count, value);
    } catch (error: any) {
      logger.error('Redis LREM error:', error);
      throw error;
    }
  }

  /**
   * Get keys by pattern
   */
  public static async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error: any) {
      logger.error('Redis KEYS error:', error);
      throw error;
    }
  }

  /**
   * Flush all keys
   */
  public static async flushall(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error: any) {
      logger.error('Redis FLUSHALL error:', error);
      throw error;
    }
  }

  /**
   * Flush all keys (alias for flushall with camelCase)
   */
  public static async flushAll(): Promise<void> {
    return this.flushall();
  }

  /**
   * Delete keys matching a pattern
   * WARNING: This uses KEYS which can be slow in production with many keys
   * Consider using SCAN for production environments with large datasets
   */
  public static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      // Delete keys in batches to avoid blocking
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const result = await this.client.del(...batch);
        deletedCount += result;
      }

      logger.debug(`Deleted ${deletedCount} keys matching pattern: ${pattern}`);
      return deletedCount;
    } catch (error: any) {
      logger.error('Redis deletePattern error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple keys
   */
  public static async deleteKeys(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(...keys);
      return result;
    } catch (error: any) {
      logger.error('Redis deleteKeys error:', error);
      throw error;
    }
  }

  /**
   * Get Redis info
   */
  public static async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error: any) {
      logger.error('Redis INFO error:', error);
      throw error;
    }
  }

  /**
   * Ping Redis
   */
  public static async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error: any) {
      logger.error('Redis PING error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public static async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = undefined as unknown as Redis;
        logger.info('Redis disconnected successfully');
      }
    } catch (error: any) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  public static getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }
}

