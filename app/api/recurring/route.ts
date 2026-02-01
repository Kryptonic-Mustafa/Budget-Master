import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const RecurringSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
  categoryId: z.number(),
  accountId: z.number(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string(), // YYYY-MM-DD
});

// GET: Fetch all rules
export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rules = await query({
      query: `
        SELECT r.*, c.name as category_name, a.name as account_name 
        FROM recurring_transactions r
        LEFT JOIN categories c ON r.category_id = c.id
        JOIN accounts a ON r.account_id = a.id
        WHERE r.user_id = ?
        ORDER BY r.next_run_date ASC
      `,
      values: [payload.userId]
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new rule
export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (typeof body.amount === 'string') body.amount = parseFloat(body.amount);
    if (typeof body.accountId === 'string') body.accountId = parseInt(body.accountId);
    if (typeof body.categoryId === 'string') body.categoryId = parseInt(body.categoryId);

    const result = RecurringSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    const { amount, type, description, categoryId, accountId, frequency, startDate } = result.data;

    await query({
      query: `
        INSERT INTO recurring_transactions 
        (user_id, account_id, category_id, amount, type, description, frequency, start_date, next_run_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [payload.userId, accountId, categoryId, amount, type, description, frequency, startDate, startDate]
    });

    return NextResponse.json({ message: 'Recurring Rule Created' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Stop a rule
export async function DELETE(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    await query({
      query: 'DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?',
      values: [id, payload.userId]
    });

    return NextResponse.json({ message: 'Rule Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}