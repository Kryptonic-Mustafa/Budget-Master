import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Force this route to always be dynamic (never cache)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    // DEBUG LOG 1: Check if token exists
    if (!token) {
        console.log("❌ API/ME: No auth_token found in cookies");
        return NextResponse.json({ user: null });
    }

    const payload: any = verifyToken(token);
    
    // DEBUG LOG 2: Check if token is valid
    if (!payload) {
        console.log("❌ API/ME: Token verification failed (Invalid or Expired)");
        return NextResponse.json({ user: null });
    }

    console.log(`✅ API/ME: Token valid for User ID: ${payload.userId}`);

    // DEBUG LOG 3: Check Database Query
    const users: any = await query({
      query: 'SELECT id, name, email, avatar_url FROM users WHERE id = ?',
      values: [payload.userId]
    });

    if (users.length === 0) {
        console.log("❌ API/ME: User ID not found in Database");
        return NextResponse.json({ user: null });
    }

    console.log("✅ API/ME: User found, returning data.");
    return NextResponse.json({ user: users[0] });

  } catch (error: any) {
    console.error("🔥 API/ME CRITICAL ERROR:", error.message);
    return NextResponse.json({ user: null });
  }
}