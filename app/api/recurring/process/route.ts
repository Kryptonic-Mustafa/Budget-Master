import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];

    // 1. Find due rules
    const dueRules: any = await query({
      query: `SELECT * FROM recurring_transactions WHERE user_id = ? AND next_run_date <= ? AND is_active = 1`,
      values: [payload.userId, today]
    });

    if (!Array.isArray(dueRules) || dueRules.length === 0) {
      return NextResponse.json({ message: 'No due transactions' });
    }

    let processedCount = 0;

    // 2. Process each
    for (const rule of dueRules) {
        // A. Create Real Transaction
        await query({
            query: `INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            values: [rule.user_id, rule.account_id, rule.category_id, rule.amount, rule.type, rule.description, rule.next_run_date] // Use due date as tx date
        });

        // B. Calculate Next Date
        let nextDate = new Date(rule.next_run_date);
        if (rule.frequency === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
        if (rule.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
        if (rule.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
        if (rule.frequency === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);

        const nextDateStr = nextDate.toISOString().split('T')[0];

        // C. Update Rule
        await query({
            query: `UPDATE recurring_transactions SET next_run_date = ? WHERE id = ?`,
            values: [nextDateStr, rule.id]
        });

        processedCount++;
    }

    return NextResponse.json({ message: `Processed ${processedCount} transactions` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}