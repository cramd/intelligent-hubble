import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { cookies } from 'next/headers';

export interface SetMetadata {
  savedPrice?: number;
  savedMsrp?: number;
  note?: string;
  ratings?: {
    price: number;
    buildFun: number;
    overall: number;
    value: number;
  };
}

function getPrefix(userToken: string) {
  return `metadata_${userToken}_`;
}

export async function GET(request: Request, props: { params: Promise<{ set_num: string }> }) {
  try {
    const params = await props.params;
    const cookieStore = await cookies();
    const userToken = cookieStore.get('rebrickable_user_token')?.value || process.env.REBRICKABLE_USER_TOKEN;

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const key = `${getPrefix(userToken)}${params.set_num}`;
    const data = await kv.get<SetMetadata>(key);

    return NextResponse.json(data || {});
  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ set_num: string }> }) {
  try {
    const params = await props.params;
    const cookieStore = await cookies();
    const userToken = cookieStore.get('rebrickable_user_token')?.value || process.env.REBRICKABLE_USER_TOKEN;

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefix = getPrefix(userToken);
    const key = `${prefix}${params.set_num}`;
    const body: SetMetadata = await request.json();

    // Fetch existing metadata to merge
    const existing = await kv.get<SetMetadata>(key) || {};
    const updated = { ...existing, ...body };

    await kv.set(key, updated);
    
    // Register in the local fallback index if using local cache
    await kv._addToIndex(prefix, key);

    return NextResponse.json({ success: true, metadata: updated });
  } catch (error: any) {
    console.error('Error saving metadata:', error);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}
