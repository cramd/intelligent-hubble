import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export async function GET() {
  let writeTest = 'skipped';
  let readTest = 'skipped';
  let scanTest = 'skipped';
  let allKeysInDb: string[] = [];
  
  const redisIsConfigured = !!(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );

  if (redisIsConfigured) {
    try {
      await kv.set('test_key_hubble', { hello: 'world' });
      writeTest = 'success';
      
      const val = await kv.get<{hello: string}>('test_key_hubble');
      readTest = val?.hello === 'world' ? 'success' : 'failed - mismatch';
      
      const keys = await kv.getAllMetadataKeys('test_key_');
      scanTest = keys.includes('test_key_hubble') ? 'success' : 'failed - key not found in scan';
      
      // Try scanning everything just to see what's in the DB
      allKeysInDb = await kv.getAllMetadataKeys('');
    } catch (e: any) {
      writeTest = `error: ${e.message}`;
    }
  }

  return NextResponse.json({
    hasKvUrl: !!process.env.KV_REST_API_URL,
    hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    redisIsConfigured,
    rebrickableTokenConfigured: !!process.env.REBRICKABLE_USER_TOKEN,
    writeTest,
    readTest,
    scanTest,
    totalKeysInDb: allKeysInDb.length,
    dbKeys: allKeysInDb
  });
}
