import { NextResponse } from 'next/server';
import { getSetDetails, LegoSet } from '@/lib/rebrickable';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function GET(request: Request, { params }: { params: Promise<{ set_num: string }> }) {
  try {
    const { set_num } = await params;
    
    // Some basic validation (Rebrickable sets usually end in -1)
    let formattedSetNum = set_num;
    if (!formattedSetNum.includes('-')) {
      formattedSetNum = `${formattedSetNum}-1`;
    }

    const cacheKey = `set-details-${formattedSetNum}`;
    const cached = await getCachedData<LegoSet>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const setDetails = await getSetDetails(formattedSetNum);
    await setCachedData(cacheKey, setDetails);

    return NextResponse.json(setDetails);
  } catch (error: any) {
    console.error('Error fetching single set:', error);
    return NextResponse.json(
      { error: error.message || 'Set not found or API error' },
      { status: error.status || 404 }
    );
  }
}
