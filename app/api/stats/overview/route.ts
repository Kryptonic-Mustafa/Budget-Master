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

    // 1. Existing Stats Queries (Balance, Income, Expense)
    const balanceRes: any = await query({
      query: 'SELECT SUM(balance) as total FROM accounts WHERE user_id = ?',
      values: [userId]
    });
    
    // Monthly stats...
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyRes: any = await query({
        query: `
          SELECT type, SUM(amount) as total 
          FROM transactions 
          WHERE user_id = ? AND transaction_date LIKE ?
          GROUP BY type
        `,
        values: [userId, `${currentMonth}%`]
    });

    // 2. NEW: Upcoming Bills (Next 7 Days)
    const upcomingRes: any = await query({
        query: `
            SELECT description, amount, next_run_date, frequency
            FROM recurring_transactions
            WHERE user_id = ? 
            AND type = 'EXPENSE'
            AND next_run_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY next_run_date ASC
        `,
        values: [userId]
    });

    const income = monthlyRes.find((r: any) => r.type === 'INCOME')?.total || 0;
    const expense = monthlyRes.find((r: any) => r.type === 'EXPENSE')?.total || 0;

    return NextResponse.json({
      totalBalance: balanceRes[0].total || 0,
      monthlyIncome: income,
      monthlyExpense: expense,
      upcomingBills: upcomingRes // Send this to frontend
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}