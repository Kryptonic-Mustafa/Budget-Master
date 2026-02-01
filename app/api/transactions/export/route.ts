import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch ALL transactions for the user (joined with readable names)
    const transactions: any = await query({
      query: `
        SELECT 
          t.transaction_date as Date,
          t.description as Description,
          t.type as Type,
          t.amount as Amount,
          c.name as Category,
          a.name as Account
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC
      `,
      values: [payload.userId]
    });

    // 2. Convert JSON to CSV String
    const headers = ['Date', 'Description', 'Type', 'Amount', 'Category', 'Account'];
    const csvRows = [headers.join(',')];

    for (const row of transactions) {
        // Format Date
        const date = new Date(row.Date).toISOString().split('T')[0];
        // Escape commas in description to avoid breaking CSV
        const desc = `"${(row.Description || '').replace(/"/g, '""')}"`;
        
        csvRows.push([
            date,
            desc,
            row.Type,
            row.Amount,
            row.Category,
            row.Account
        ].join(','));
    }

    const csvString = csvRows.join('\n');

    // 3. Return as Downloadable File
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}