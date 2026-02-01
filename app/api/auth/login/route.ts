import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // 2. Find User (Select 'password' explicitly)
    const users: any = await query({
      query: 'SELECT * FROM users WHERE email = ?',
      values: [email],
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];

    // 3. Safety Check: Does the user have a password set?
    if (!user.password) {
         return NextResponse.json({ error: 'Account setup incomplete. Please contact support or re-register.' }, { status: 401 });
    }

    // 4. Verify Password (Compare input vs user.password)
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 5. Generate Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // 6. Set Cookie
    cookies().set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ 
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url } 
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}