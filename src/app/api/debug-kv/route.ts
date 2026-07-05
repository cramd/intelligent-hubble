import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasKvUrl: !!process.env.KV_REST_API_URL,
    hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    redisIsConfigured: !!(
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ),
    rebrickableTokenConfigured: !!process.env.REBRICKABLE_USER_TOKEN,
  });
}
