import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { transactions, accountId } = body; // Array of { date, description, amount, type }

    if (!Array.isArray(transactions) || transactions.length === 0) {
        return NextResponse.json({ error: 'No transactions found' }, { status: 400 });
    }

    // Default Category ID (e.g., 1 for "Uncategorized") - You might want to let user pick, but we'll default for speed
    const DEFAULT_CATEGORY = 1; 

    // Build Bulk Insert Query
    // We construct the values string manually for bulk insertion
    const values: any[] = [];
    const placeholders = transactions.map((t) => {
        values.push(
            payload.userId, 
            accountId, 
            DEFAULT_CATEGORY, 
            t.amount, 
            t.type, 
            t.description, 
            t.date
        );
        return '(?, ?, ?, ?, ?, ?, ?)';
    }).join(', ');

    await query({
      query: `
        INSERT INTO transactions 
        (user_id, account_id, category_id, amount, type, description, transaction_date) 
        VALUES ${placeholders}
      `,
      values: values
    });

    return NextResponse.json({ message: `Successfully imported ${transactions.length} transactions` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}