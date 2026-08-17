import { StorageAdapter } from 'grammy';

export interface RedisSessionOptions {
  redisUrl?: string;
  host?: string;
  port?: number;
  prefix?: string;
  ttlSeconds?: number;
}

/**
 * Custom lightweight Redis Storage Adapter for grammY sessions with lazy loader
 */
export function createRedisStorage<T>(options: RedisSessionOptions): {
  storage: StorageAdapter<T>;
  client: any;
} {
  let RedisClass: any;
  try {
    RedisClass = require('ioredis');
    if (RedisClass.default) {
      RedisClass = RedisClass.default;
    }
  } catch (err) {
    throw new Error(
      '[bot-core] ioredis is required to use createRedisStorage. Please install ioredis in your bot package.'
    );
  }

  const prefix = options.prefix || 'bot_session:';
  const ttl = options.ttlSeconds || 60 * 60 * 24 * 7; // 7 days default

  let client: any;
  if (options.redisUrl) {
    client = new RedisClass(options.redisUrl);
  } else {
    client = new RedisClass({
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || Number(process.env.REDIS_PORT) || 6379,
    });
  }

  client.on('error', (err: any) => {
    console.error(`[RedisSession] Error on ${prefix}:`, err.message);
  });

  const storage: StorageAdapter<T> = {
    read: async (key: string): Promise<T | undefined> => {
      try {
        const raw = await client.get(`${prefix}${key}`);
        if (!raw) return undefined;
        return JSON.parse(raw) as T;
      } catch (err) {
        console.error(`[RedisSession] read error for ${key}:`, err);
        return undefined;
      }
    },
    write: async (key: string, value: T): Promise<void> => {
      try {
        const raw = JSON.stringify(value);
        await client.set(`${prefix}${key}`, raw, 'EX', ttl);
      } catch (err) {
        console.error(`[RedisSession] write error for ${key}:`, err);
      }
    },
    delete: async (key: string): Promise<void> => {
      try {
        await client.del(`${prefix}${key}`);
      } catch (err) {
        console.error(`[RedisSession] delete error for ${key}:`, err);
      }
    },
  };

  return { storage, client };
}
