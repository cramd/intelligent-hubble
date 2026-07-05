import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserSets, getSetsByTheme, getThemes, LegoSet } from '@/lib/rebrickable';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function GET() {
  try {
    // 1. Passcode security check
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('recommendations_auth')?.value;
    const serverPasscode = process.env.RECOMMENDATION_PASSCODE || 'bricksecure123';
    
    // If not authenticated, return 403 Forbidden
    if (authCookie !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized: Passcode verification required.' }, { status: 403 });
    }

    // 2. User Token retrieval
    const userToken = cookieStore.get('rebrickable_user_token')?.value || process.env.REBRICKABLE_USER_TOKEN;
    if (!userToken) {
      return NextResponse.json({ error: 'User is not logged in to Rebrickable.' }, { status: 400 });
    }

    const cacheKey = `user-recommendations-${userToken}`;
    const cachedRecommendations = await getCachedData<any>(cacheKey, 3600 * 6); // Cache for 6 hours
    if (cachedRecommendations) {
      return NextResponse.json(cachedRecommendations);
    }

    // 3. Get the user's current sets to build theme affinity & filter owned sets
    const userSets = await getUserSets(userToken);
    if (userSets.length === 0) {
      return NextResponse.json({ recommendations: [], themeAffinity: [] });
    }

    // Create a lookup map of owned set numbers
    const ownedSets = new Set(userSets.map(item => item.set.set_num));

    // Calculate theme counts
    const themeMap: Record<number, { name: string; count: number }> = {};
    
    // Fetch all themes to construct a map of ID -> Name
    let themesList = [];
    try {
      const themesCacheKey = 'rebrickable-all-themes';
      const cachedThemes = await getCachedData<any[]>(themesCacheKey, 3600 * 24 * 7); // Cache themes list for a week
      if (cachedThemes) {
        themesList = cachedThemes;
      } else {
        themesList = await getThemes();
        await setCachedData(themesCacheKey, themesList);
      }
    } catch (e) {
      console.error('Failed to load themes:', e);
    }

    const themeNameMap: Record<number, string> = {};
    for (const theme of themesList) {
      themeNameMap[theme.id] = theme.name;
    }

    for (const item of userSets) {
      const themeId = item.set.theme_id;
      const themeName = themeNameMap[themeId] || `Theme ${themeId}`;
      if (!themeMap[themeId]) {
        themeMap[themeId] = { name: themeName, count: 0 };
      }
      themeMap[themeId].count += item.quantity;
    }

    // Sort themes by count to get top themes
    const sortedThemes = Object.entries(themeMap)
      .map(([id, data]) => ({
        id: parseInt(id),
        name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count);

    // Get top 3 themes
    const topThemes = sortedThemes.slice(0, 3);

    // Fetch recommendations for each top theme
    const recommendations = [];
    for (const theme of topThemes) {
      try {
        const rawSets = await getSetsByTheme(theme.id, 10);
        // Filter out sets the user already owns
        const recommendedSets = rawSets
          .filter(set => !ownedSets.has(set.set_num))
          .slice(0, 4); // Limit to top 4 recommendations per theme

        if (recommendedSets.length > 0) {
          recommendations.push({
            themeId: theme.id,
            themeName: theme.name,
            reason: `Because you own ${theme.count} set${theme.count > 1 ? 's' : ''} in the "${theme.name}" theme.`,
            sets: recommendedSets
          });
        }
      } catch (err) {
        console.error(`Failed to fetch recommendations for theme ${theme.id}:`, err);
      }
    }

    const result = {
      recommendations,
      themeAffinity: sortedThemes.slice(0, 5) // Top 5 themes for affinity chart
    };

    // Cache the final results
    await setCachedData(cacheKey, result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
