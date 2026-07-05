import { NextResponse } from 'next/server';
import { getThemes, getUserSets, LegoSet } from '@/lib/rebrickable';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function GET() {
  try {
    const userToken = process.env.REBRICKABLE_USER_TOKEN;
    if (!userToken) {
      return NextResponse.json({ error: 'User token is not configured.' }, { status: 500 });
    }

    const cacheKey = `user-recommendations-${userToken}`;
    const cachedRecommendations = await getCachedData(cacheKey, 3600 * 24); // Cache for 24 hours
    if (cachedRecommendations) {
      return NextResponse.json(cachedRecommendations);
    }

    // A simple recommendation algorithm based on themes:
    // 1. Get the user's current sets
    const userSets = await getUserSets(userToken);
    if (userSets.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // 2. Find the most popular themes in their collection
    const themeCounts: Record<number, number> = {};
    for (const item of userSets) {
      const themeId = item.set.theme_id;
      themeCounts[themeId] = (themeCounts[themeId] || 0) + 1;
    }

    const topThemeId = Object.keys(themeCounts)
      .map(id => parseInt(id))
      .sort((a, b) => themeCounts[b] - themeCounts[a])[0];

    // For the MVP, we just return the top theme ID.
    // In a full implementation, we would query Rebrickable for popular sets in this theme
    // that the user doesn't own yet (using /lego/sets/?theme_id=...&ordering=-year)
    // To keep it simple and avoid too many API calls initially, we return dummy data based on the theme.

    const recommendations = [
      {
        reason: `Based on your favorite theme (ID: ${topThemeId})`,
        // We'd ideally fetch real sets here, but we don't want to exhaust API limits during setup
        sets: [] 
      }
    ];

    await setCachedData(cacheKey, recommendations);

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
