import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { cookies } from 'next/headers';
import { SetMetadata } from '../set-metadata/[set_num]/route';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get('rebrickable_user_token')?.value || process.env.REBRICKABLE_USER_TOKEN;

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefix = `metadata_${userToken}_`;
    const keys = await kv.getAllMetadataKeys(prefix);

    let totalValue = 0;
    const items: Record<string, SetMetadata> = {};

    for (const key of keys) {
      const data = await kv.get<SetMetadata>(key);
      if (data) {
        const setNum = key.replace(prefix, '');
        items[setNum] = data;
        if (data.savedPrice) {
          totalValue += data.savedPrice;
        }
      }
    }

    // Since we don't have historical data configured yet, we will just return the aggregated total
    // and the items map so the frontend can rank/display it.
    
    return NextResponse.json({
      totalValue,
      items
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
