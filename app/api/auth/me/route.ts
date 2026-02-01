import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) return NextResponse.json({ user: null });

    const payload: any = verifyToken(token);
    if (!payload) return NextResponse.json({ user: null });

    // Fetch fresh details from DB
    const users: any = await query({
      query: 'SELECT name, email, avatar_url FROM users WHERE id = ?',
      values: [payload.userId]
    });

    if (users.length === 0) return NextResponse.json({ user: null });

    return NextResponse.json({ user: users[0] });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}