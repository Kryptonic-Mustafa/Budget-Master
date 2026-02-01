import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/logger'; 

// GET: Fetch Data Counts AND Preview Rows
export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = payload.userId;

    console.log(`🔍 Fetching data preview for user ${userId}...`);

    const [tx, acc, cat, sav, rec] = await Promise.all([
        query({ query: 'SELECT id, transaction_date as date, description, amount, type FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 20', values: [userId] }),
        query({ query: 'SELECT id, name, balance, type FROM accounts WHERE user_id = ? LIMIT 20', values: [userId] }),
        query({ query: 'SELECT id, name, type, budget_limit FROM categories WHERE user_id = ? LIMIT 20', values: [userId] }),
        query({ query: 'SELECT id, name, current_amount, target_amount FROM savings_goals WHERE user_id = ? LIMIT 20', values: [userId] }),
        query({ query: 'SELECT id, description, amount, frequency FROM recurring_rules WHERE user_id = ? LIMIT 20', values: [userId] }),
    ]);

    // Also get total counts if needed (or just use array length for small data)
    // For now, we assume the arrays act as the preview source.
    
    return NextResponse.json({
        transactions: tx,
        accounts: acc,
        categories: cat,
        savings_goals: sav,
        recurring_rules: rec
    });

  } catch (error: any) {
    console.error("❌ DATA PREVIEW ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Wipe Data (Unchanged, but included for completeness)
export async function DELETE(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { deleteUser } = body;
    const userId = payload.userId;

    if (deleteUser) {
        await query({ query: 'DELETE FROM transactions WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM accounts WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM categories WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM savings_goals WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM recurring_rules WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM settings WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM activity_logs WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM users WHERE id = ?', values: [userId] });
        cookies().delete('auth_token');
        return NextResponse.json({ message: 'Account Deleted' });
    } else {
        await query({ query: 'DELETE FROM transactions WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM accounts WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM categories WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM savings_goals WHERE user_id = ?', values: [userId] });
        await query({ query: 'DELETE FROM recurring_rules WHERE user_id = ?', values: [userId] });
        await logActivity(userId, 'DATA_RESET', 'User performed a full data reset');
        cookies().delete('auth_token');
        return NextResponse.json({ message: 'Data Reset Successful' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}