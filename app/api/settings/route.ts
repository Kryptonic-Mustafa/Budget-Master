import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = payload.userId;

    // FIX: Typed as 'any' so TypeScript allows checking .length
    const settings: any = await query({
      query: `SELECT * FROM settings WHERE user_id = ?`,
      values: [userId]
    });

    // If no settings exist yet, create default
    if (!settings || settings.length === 0) {
        await query({
            query: `INSERT INTO settings (user_id) VALUES (?)`,
            values: [payload.userId]
        });
        
        // Return defaults
        return NextResponse.json({
            country: 'US',
            currency: 'USD',
            currency_symbol: '$',
            decimals: 2
        });
    }

    return NextResponse.json(settings[0]);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
      const token = cookies().get('auth_token')?.value;
      const payload: any = verifyToken(token || '');
      if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
      const body = await req.json();
      const { country, currency, currency_symbol, decimals } = body;
  
      // Upsert (Update if exists, Insert if not)
      await query({
        query: `
            INSERT INTO settings (user_id, country, currency, currency_symbol, decimals)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            country = VALUES(country),
            currency = VALUES(currency),
            currency_symbol = VALUES(currency_symbol),
            decimals = VALUES(decimals)
        `,
        values: [payload.userId, country, currency, currency_symbol, decimals]
      });
  
      return NextResponse.json({ message: 'Settings Updated' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}