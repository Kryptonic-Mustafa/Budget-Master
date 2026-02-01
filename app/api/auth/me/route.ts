import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = cookies().get('auth_token')?.value;
    
    // If no token, return null user (Sidebar stays hidden)
    if (!token) {
        return NextResponse.json({ user: null });
    }

    const payload: any = verifyToken(token);
    
    if (!payload) {
        return NextResponse.json({ user: null });
    }

    // Fetch user details from DB
    const users: any = await query({
      query: 'SELECT id, name, email, avatar_url FROM users WHERE id = ?',
      values: [payload.userId]
    });

    if (users.length === 0) {
        return NextResponse.json({ user: null });
    }

    // Return the user data
    return NextResponse.json({ user: users[0] });

  } catch (error) {
    console.error("Fetch User Error:", error);
    return NextResponse.json({ user: null });
  }
}