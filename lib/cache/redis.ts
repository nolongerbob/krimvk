import 'server-only';
import Redis from 'ioredis';

type MemoryEntry = { value: string; expiresAt: number };

const memoryStore = new Map<string, MemoryEntry>();

let redisClient: Redis | null = null;
let redisUnavailable = false;

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url || redisUnavailable) return null;

  if (!redisClient) {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redisClient.on('error', (err) => {
      console.warn('[cache] Redis error, falling back to memory:', err.message);
      redisUnavailable = true;
    });
  }

  return redisClient;
}

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status !== 'ready') await redis.connect();
      const value = await redis.get(key);
      if (value !== null) return value;
    } catch {
      redisUnavailable = true;
    }
  }
  return memoryGet(key);
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  memorySet(key, value, ttlSeconds);

  const redis = getRedisClient();
  if (!redis) return;

  try {
    if (redis.status !== 'ready') await redis.connect();
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch {
    redisUnavailable = true;
  }
}

export async function cacheDel(key: string): Promise<void> {
  memoryStore.delete(key);
  const redis = getRedisClient();
  if (!redis) return;
  try {
    if (redis.status !== 'ready') await redis.connect();
    await redis.del(key);
  } catch {
    redisUnavailable = true;
  }
}

export async function cacheIncr(
  key: string,
  windowSeconds: number
): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    try {
      if (redis.status !== 'ready') await redis.connect();
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      return count;
    } catch {
      redisUnavailable = true;
    }
  }

  const memKey = `incr:${key}`;
  const current = memoryGet(memKey);
  const count = current ? Number.parseInt(current, 10) + 1 : 1;
  memorySet(memKey, String(count), windowSeconds);
  return count;
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}
