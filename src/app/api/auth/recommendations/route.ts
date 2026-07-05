import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();
    const serverPasscode = process.env.RECOMMENDATION_PASSCODE || 'bricksecure123';

    if (passcode !== serverPasscode) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('recommendations_auth', 'authenticated', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
