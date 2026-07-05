import { NextResponse } from 'next/server';
import { getUserSets } from '@/lib/rebrickable';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function GET() {
  try {
    const userToken = process.env.REBRICKABLE_USER_TOKEN;
    if (!userToken) {
      return NextResponse.json({ error: 'User token is not configured.' }, { status: 500 });
    }

    const cacheKey = `user-collection-${userToken}`;
    
    // Try to get from cache first
    const cachedCollection = await getCachedData(cacheKey);
    if (cachedCollection) {
      return NextResponse.json(cachedCollection);
    }

    // Fetch from API
    const userSets = await getUserSets(userToken);
    
    // Save to cache (cache for 1 hour to avoid rate limits)
    await setCachedData(cacheKey, userSets);

    return NextResponse.json(userSets);
  } catch (error: any) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
