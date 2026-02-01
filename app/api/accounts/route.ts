import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const AccountSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['CASH', 'BANK', 'CREDIT', 'WALLET', 'INVESTMENT']),
  balance: z.number(),
  color: z.string().optional(),
});

// GET & DELETE (Keep your existing code for these, ensuring DELETE is secure)
export async function GET(req: Request) {
    // ... (Keep existing GET code)
    try {
        const token = cookies().get('auth_token')?.value;
        const payload: any = verifyToken(token || '');
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
        const accounts = await query({
          query: 'SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC',
          values: [payload.userId]
        });
    
        return NextResponse.json(accounts);
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
}

export async function DELETE(req: Request) {
    // ... (Keep existing DELETE code)
    try {
        const token = cookies().get('auth_token')?.value;
        const payload: any = verifyToken(token || '');
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
    
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
        await query({
          query: 'DELETE FROM accounts WHERE id = ? AND user_id = ?',
          values: [id, payload.userId]
        });
    
        return NextResponse.json({ message: 'Account Deleted' });
    
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
}

// POST (Create)
export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (typeof body.balance === 'string') body.balance = parseFloat(body.balance);

    const result = AccountSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    const { name, type, balance, color } = result.data;

    const insert: any = await query({
      query: `INSERT INTO accounts (user_id, name, type, balance, color) VALUES (?, ?, ?, ?, ?)`,
      values: [payload.userId, name, type, balance, color || '#3b82f6']
    });

    // Return the full object so frontend can update state immediately
    return NextResponse.json({ 
        id: insert.insertId, 
        user_id: payload.userId,
        name, type, balance, color, 
        created_at: new Date() 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT (Edit/Update) - NEW CODE
export async function PUT(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    
    if (typeof data.balance === 'string') data.balance = parseFloat(data.balance);

    const result = AccountSchema.safeParse(data);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    const { name, type, balance, color } = result.data;

    await query({
      query: `UPDATE accounts SET name=?, type=?, balance=?, color=? WHERE id=? AND user_id=?`,
      values: [name, type, balance, color, id, payload.userId]
    });

    return NextResponse.json({ message: 'Account Updated', account: { id, ...data } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}