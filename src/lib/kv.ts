import { Redis } from '@upstash/redis';
import { getCachedData, setCachedData } from './cache';

// Initialize Redis if the environment variables are present (Vercel KV or Upstash)
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = kvUrl && kvToken ? new Redis({ url: kvUrl, token: kvToken }) : null;

/**
 * Universal KV Store Wrapper
 * Automatically falls back to local file-system caching if Vercel KV/Redis is not configured.
 */
export const kv = {
  get: async <T>(key: string): Promise<T | null> => {
    if (redis) {
      return await redis.get<T>(key);
    }
    // Fallback: 100 years TTL for "persistent" local storage
    return await getCachedData<T>(`kv_fallback_${key}`, 60 * 60 * 24 * 365 * 100);
  },
  
  set: async <T>(key: string, value: T): Promise<void> => {
    if (redis) {
      await redis.set(key, value);
    } else {
      await setCachedData(`kv_fallback_${key}`, value);
    }
  },

  // Scan or get all keys matching a pattern (needed for Portfolio aggregation)
  // For local fallback, this would be complicated since cache is just files.
  // Instead, we will maintain an "index" key of all saved metadata keys.
  getAllMetadataKeys: async (prefix: string): Promise<string[]> => {
    if (redis) {
      let cursor = '0';
      let allKeys: string[] = [];
      do {
        const [nextCursor, keys] = await redis.scan(cursor, { match: `${prefix}*`, count: 1000 });
        cursor = nextCursor;
        allKeys = allKeys.concat(keys);
      } while (cursor !== '0');
      return allKeys;
    }
    
    // Local fallback: retrieve the manually maintained index
    const index = await getCachedData<string[]>(`kv_index_${prefix}`, 60 * 60 * 24 * 365 * 100);
    return index || [];
  },

  // Internal helper for local fallback index
  _addToIndex: async (prefix: string, key: string) => {
    if (!redis) {
      const indexKey = `kv_index_${prefix}`;
      const index = (await getCachedData<string[]>(indexKey, 60 * 60 * 24 * 365 * 100)) || [];
      if (!index.includes(key)) {
        index.push(key);
        await setCachedData(indexKey, index);
      }
    }
  }
};
