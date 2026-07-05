import { NextResponse } from 'next/server';
import { getSetLists, addSetToList, deleteSetFromList, updateSetInList } from '@/lib/rebrickable';
import { getCachedData, setCachedData } from '@/lib/cache';

import { cookies } from 'next/headers';

// Payload format: { additions: [{ set_num: string, quantity: number }], modifications: [...], deletions: [string] }
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('rebrickable_user_token')?.value;
    const userToken = tokenFromCookie || process.env.REBRICKABLE_USER_TOKEN;
    
    if (!userToken || userToken === "your_user_token_here") {
      return NextResponse.json({ error: 'User token is not configured.' }, { status: 401 });
    }

    const { additions = [], modifications = [], deletions = [] } = await request.json();

    // 1. Get user lists to find the default list ID
    const lists = await getSetLists(userToken);
    if (lists.length === 0) {
      return NextResponse.json({ error: 'No set lists found for this user.' }, { status: 404 });
    }
    // Just use the first list (usually the default "My Sets" list)
    const listId = lists[0].id;

    // 2. Process Deletions
    for (const setNum of deletions) {
      try {
        await deleteSetFromList(userToken, listId, setNum);
      } catch (e: any) {
        console.error(`Failed to delete ${setNum}:`, e.message);
      }
    }

    // 3. Process Additions
    for (const add of additions) {
      try {
        await addSetToList(userToken, listId, add.set_num, add.quantity);
      } catch (e: any) {
        console.error(`Failed to add ${add.set_num}:`, e.message);
      }
    }

    // 4. Process Modifications
    for (const mod of modifications) {
      try {
        await updateSetInList(userToken, listId, mod.set_num, mod.quantity);
      } catch (e: any) {
        console.error(`Failed to modify ${mod.set_num}:`, e.message);
      }
    }

    // 5. Clear the cache so next page load fetches fresh data
    const cacheKey = `user-collection-${userToken}`;
    await setCachedData(cacheKey, null); // Clear cache

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in sync:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}
