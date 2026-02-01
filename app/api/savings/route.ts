import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const GoalSchema = z.object({
  name: z.string().min(2),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).optional(),
  target_date: z.string().optional(), // YYYY-MM-DD
  color: z.string().optional(),
});

// GET: Fetch Goals
export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goals = await query({
      query: `SELECT * FROM savings_goals WHERE user_id = ? ORDER BY target_date ASC`,
      values: [payload.userId]
    });

    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create Goal
export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (typeof body.target_amount === 'string') body.target_amount = parseFloat(body.target_amount);
    if (typeof body.current_amount === 'string') body.current_amount = parseFloat(body.current_amount);

    const result = GoalSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    const { name, target_amount, current_amount, target_date, color } = result.data;

    await query({
      query: `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, color) VALUES (?, ?, ?, ?, ?, ?)`,
      values: [payload.userId, name, target_amount, current_amount || 0, target_date || null, color || '#10b981']
    });

    return NextResponse.json({ message: 'Goal Created' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update Goal (Contribute money)
export async function PUT(req: Request) {
    try {
      const token = cookies().get('auth_token')?.value;
      const payload: any = verifyToken(token || '');
      if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
      const body = await req.json();
      const { id, amount } = body; // Amount to ADD
  
      await query({
        query: `UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?`,
        values: [parseFloat(amount), id, payload.userId]
      });
  
      return NextResponse.json({ message: 'Goal Updated' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

// DELETE: Remove Goal
export async function DELETE(req: Request) {
    try {
      const token = cookies().get('auth_token')?.value;
      const payload: any = verifyToken(token || '');
      if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
  
      await query({
        query: 'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
        values: [id, payload.userId]
      });
  
      return NextResponse.json({ message: 'Goal Deleted' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }