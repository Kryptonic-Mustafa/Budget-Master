import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
// DIRECT RELATIVE IMPORT
import { logActivity } from '../../../../lib/logger';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Check User
    const users: any = await query({
        query: 'SELECT * FROM users WHERE email = ?',
        values: [email],
    });

    if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const user = users[0];
    
    // --- FIX: Check 'password_hash' instead of 'password' ---
    if (!user.password_hash) {
        return NextResponse.json({ error: 'Account setup incomplete (No Password)' }, { status: 401 });
    }

    // 2. Check Password (using password_hash)
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // 3. Generate Token
    const token = signToken({ userId: user.id, email: user.email });
    cookies().set('auth_token', token, { httpOnly: true, secure: true });

    // 4. LOG ACTIVITY
    try {
        await logActivity(user.id, 'LOGIN', 'User logged in');
    } catch (e) {
        console.error("Logging failed:", e);
    }

    return NextResponse.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}