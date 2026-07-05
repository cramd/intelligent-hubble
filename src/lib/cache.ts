import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.tmpdir(), 'lego-showcase-cache');

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
  }
}

export async function getCachedData<T>(key: string, ttlSeconds: number = 3600): Promise<T | null> {
  await ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);

  try {
    const stats = await fs.stat(filePath);
    const now = Date.now();
    const ageSeconds = (now - stats.mtimeMs) / 1000;

    if (ageSeconds > ttlSeconds) {
      return null; // Cache expired
    }

    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    return null; // Cache miss or error reading
  }
}

export async function setCachedData(key: string, data: any): Promise<void> {
  await ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);

  try {
    await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
  } catch (error) {
    console.error('Failed to write to cache', error);
  }
}
