import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { logActivity } from '../../../lib/logger';

// GET Settings
export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await query({
      query: `SELECT * FROM settings WHERE user_id = ?`,
      values: [payload.userId]
    });

    // If no settings exist yet, create default
    if (settings.length === 0) {
        await query({
            query: `INSERT INTO settings (user_id) VALUES (?)`,
            values: [payload.userId]
        });
        return NextResponse.json({ country: 'US', currency: 'USD', currency_symbol: '$', decimals: 2 });
    }

    return NextResponse.json(settings[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE Settings
export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { country, currency, currency_symbol, decimals } = body;

    await query({
      query: `UPDATE settings SET country=?, currency=?, currency_symbol=?, decimals=? WHERE user_id=?`,
      values: [country, currency, currency_symbol, decimals, payload.userId]
    });

    await logActivity(payload.userId, 'UPDATE_SETTINGS', `Updated settings: ${currency} (${decimals} decimals)`);

    return NextResponse.json({ message: 'Settings Updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}