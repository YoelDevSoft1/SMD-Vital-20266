import Redis from 'ioredis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class RedisService {
  private static client: Redis | null = null;
  private static available = false;

  /**
   * Initialize Redis connection — non-fatal if Redis is unavailable
   */
  public static async initialize(): Promise<void> {
    if (!config.redis.url || config.redis.url === 'redis://localhost:6379') {
      logger.warn('Redis URL not configured — running without cache');
      return;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.available = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.available = false;
        logger.error('Redis connection error:', error);
      });

      this.client.on('close', () => {
        this.available = false;
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.ping();
      this.available = true;
      logger.info('Redis connection test successful');
    } catch (error: any) {
      this.available = false;
      this.client = null;
      logger.warn('Redis unavailable — running without cache:', error.message);
      // Non-fatal: server continues without Redis
    }
  }

  private static isReady(): boolean {
    return this.available && this.client !== null;
  }

  public static isAvailable(): boolean {
    return this.isReady();
  }

  public static async get(key: string): Promise<string | null> {
    if (!this.isReady()) return null;
    try {
      return await this.client!.get(key);
    } catch {
      return null;
    }
  }

  public static async set(key: string, value: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.set(key, value);
    } catch {
      // ignore
    }
  }

  public static async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.setex(key, seconds, value);
    } catch {
      // ignore
    }
  }

  public static async del(key: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.del(key);
    } catch {
      // ignore
    }
  }

  public static async exists(key: string): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      return (await this.client!.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  public static async expire(key: string, seconds: number): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.expire(key, seconds);
    } catch {
      // ignore
    }
  }

  public static async ttl(key: string): Promise<number> {
    if (!this.isReady()) return -1;
    try {
      return await this.client!.ttl(key);
    } catch {
      return -1;
    }
  }

  public static async incr(key: string): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return await this.client!.incr(key);
    } catch {
      return 0;
    }
  }

  public static async incrby(key: string, increment: number): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return await this.client!.incrby(key, increment);
    } catch {
      return 0;
    }
  }

  public static async decr(key: string): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return await this.client!.decr(key);
    } catch {
      return 0;
    }
  }

  public static async decrby(key: string, decrement: number): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return await this.client!.decrby(key, decrement);
    } catch {
      return 0;
    }
  }

  public static async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isReady()) return keys.map(() => null);
    try {
      return await this.client!.mget(...keys);
    } catch {
      return keys.map(() => null);
    }
  }

  public static async mset(keyValuePairs: Record<string, string>): Promise<void> {
    if (!this.isReady()) return;
    try {
      const args: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        args.push(key, value);
      }
      await this.client!.mset(...args);
    } catch {
      // ignore
    }
  }

  public static async hget(key: string, field: string): Promise<string | null> {
    if (!this.isReady()) return null;
    try {
      return await this.client!.hget(key, field);
    } catch {
      return null;
    }
  }

  public static async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.hset(key, field, value);
    } catch {
      // ignore
    }
  }

  public static async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isReady()) return {};
    try {
      return await this.client!.hgetall(key);
    } catch {
      return {};
    }
  }

  public static async hdel(key: string, field: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.hdel(key, field);
    } catch {
      // ignore
    }
  }

  public static async sadd(key: string, member: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.sadd(key, member);
    } catch {
      // ignore
    }
  }

  public static async smembers(key: string): Promise<string[]> {
    if (!this.isReady()) return [];
    try {
      return await this.client!.smembers(key);
    } catch {
      return [];
    }
  }

  public static async srem(key: string, member: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.srem(key, member);
    } catch {
      // ignore
    }
  }

  public static async sismember(key: string, member: string): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      return (await this.client!.sismember(key, member)) === 1;
    } catch {
      return false;
    }
  }

  public static async lpush(key: string, value: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.lpush(key, value);
    } catch {
      // ignore
    }
  }

  public static async rpush(key: string, value: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.rpush(key, value);
    } catch {
      // ignore
    }
  }

  public static async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isReady()) return [];
    try {
      return await this.client!.lrange(key, start, stop);
    } catch {
      return [];
    }
  }

  public static async llen(key: string): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return await this.client!.llen(key);
    } catch {
      return 0;
    }
  }

  public static async lrem(key: string, count: number, value: string): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.lrem(key, count, value);
    } catch {
      // ignore
    }
  }

  public static async keys(pattern: string): Promise<string[]> {
    if (!this.isReady()) return [];
    try {
      return await this.client!.keys(pattern);
    } catch {
      return [];
    }
  }

  public static async flushall(): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this.client!.flushall();
    } catch {
      // ignore
    }
  }

  public static async flushAll(): Promise<void> {
    return this.flushall();
  }

  public static async deletePattern(pattern: string): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      const batchSize = 100;
      let deletedCount = 0;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        deletedCount += await this.client!.del(...batch);
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }

  public static async deleteKeys(keys: string[]): Promise<number> {
    if (!this.isReady() || keys.length === 0) return 0;
    try {
      return await this.client!.del(...keys);
    } catch {
      return 0;
    }
  }

  public static async info(): Promise<string> {
    if (!this.isReady()) return 'Redis not available';
    try {
      return await this.client!.info();
    } catch {
      return 'Redis not available';
    }
  }

  public static async ping(): Promise<string> {
    if (!this.isReady()) return 'PONG (offline)';
    try {
      return await this.client!.ping();
    } catch {
      return 'PONG (offline)';
    }
  }

  public static async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      // ignore
    } finally {
      this.client = null;
      this.available = false;
    }
  }

  public static getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }
}
