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

    // 1. Get Raw History
    const rawHistory: any = await query({
      query: `
        SELECT 
          DATE_FORMAT(transaction_date, '%Y-%m') as month, 
          type, 
          SUM(amount) as total 
        FROM transactions 
        WHERE user_id = ? 
          AND transaction_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month, type 
        ORDER BY month ASC
      `,
      values: [userId]
    });

    // Transform History
    const historyMap = new Map();
    rawHistory.forEach((row: any) => {
        if (!historyMap.has(row.month)) {
            historyMap.set(row.month, { month: row.month, income: 0, expense: 0 });
        }
        const entry = historyMap.get(row.month);
        const amount = Math.abs(parseFloat(row.total)); // Ensure Number
        
        if (row.type === 'INCOME') entry.income += amount;
        else if (row.type === 'EXPENSE') entry.expense += amount;
    });

    const historyData = Array.from(historyMap.values());

    // 2. Spending by Category
    const rawCategoryData: any = await query({
      query: `
        SELECT 
          COALESCE(c.name, 'Uncategorized') as name, 
          ABS(SUM(t.amount)) as total 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'EXPENSE'
        GROUP BY c.name
        HAVING total > 0 
        ORDER BY total DESC
      `,
      values: [userId]
    });

    // --- FIX IS HERE: Convert "total" string to Number ---
    const categoryData = rawCategoryData.map((cat: any) => ({
      name: cat.name,
      total: parseFloat(cat.total) // <--- CRITICAL FIX
    }));

    return NextResponse.json({ history: historyData, categories: categoryData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}