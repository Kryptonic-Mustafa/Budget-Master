import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
// DIRECT RELATIVE IMPORT
import { logActivity } from '../../../../lib/logger';

export async function POST() {
  const token = cookies().get('auth_token')?.value;
  const payload: any = verifyToken(token || '');

  if (payload && payload.userId) {
      await logActivity(payload.userId, 'LOGOUT', 'User logged out');
  }

  cookies().delete('auth_token');
  return NextResponse.json({ message: 'Logged out successfully' });
}