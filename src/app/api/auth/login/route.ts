import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const apiKey = process.env.REBRICKABLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server is missing API Key' }, { status: 500 });
    }

    const res = await fetch('https://rebrickable.com/api/v3/users/_token/', {
      method: 'POST',
      headers: {
        'Authorization': `key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({ username, password }).toString()
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.detail || 'Invalid credentials' }, { status: res.status });
    }

    const data = await res.json();
    const userToken = data.user_token;

    // Await the cookies() call for Next.js 15 compatibility
    const cookieStore = await cookies();
    cookieStore.set('rebrickable_user_token', userToken, { 
      path: '/', 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return NextResponse.json({ success: true, user_token: userToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
