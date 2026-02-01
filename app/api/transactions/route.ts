import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';
// DIRECT RELATIVE IMPORT
import { logActivity } from '../../../lib/logger';

const TransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
  categoryId: z.number(),
  accountId: z.number(),
  date: z.string(),
  receipt_data: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const rawLimit = searchParams.get('limit');
    const limit = rawLimit ? parseInt(rawLimit, 10) : 50;

    let sql = `
      SELECT t.*, c.name as category_name, a.name as account_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
    `;
    const values: any[] = [payload.userId];

    if (type && type !== 'ALL') { sql += ` AND t.type = ?`; values.push(type); }
    if (accountId) { sql += ` AND t.account_id = ?`; values.push(parseInt(accountId, 10)); }
    if (categoryId && categoryId !== 'ALL') { sql += ` AND t.category_id = ?`; values.push(parseInt(categoryId, 10)); }
    if (search) { sql += ` AND t.description LIKE ?`; values.push(`%${search}%`); }
    if (startDate) { sql += ` AND t.transaction_date >= ?`; values.push(startDate); }
    if (endDate) { sql += ` AND t.transaction_date <= ?`; values.push(endDate); }

    sql += ` ORDER BY t.transaction_date DESC, t.id DESC LIMIT ${limit}`;
    const transactions = await query({ query: sql, values });

    return NextResponse.json(transactions);
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
    if (body.amount) body.amount = parseFloat(body.amount);
    if (body.accountId) body.accountId = parseInt(body.accountId, 10);
    if (body.categoryId) body.categoryId = parseInt(body.categoryId, 10);

    const result = TransactionSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    const { amount, type, description, categoryId, accountId, date, receipt_data } = result.data;

    const insert: any = await query({
      query: `INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, transaction_date, receipt_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [payload.userId, accountId, categoryId, amount, type, description, date, receipt_data || null]
    });

    // LOGGING
    await logActivity(payload.userId, 'CREATE_TRANSACTION', `Added ${type}: ${description} ($${amount})`);

    return NextResponse.json({ message: 'Transaction Added', id: insert.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    if (data.amount) data.amount = parseFloat(data.amount);
    if (data.accountId) data.accountId = parseInt(data.accountId, 10);
    if (data.categoryId) data.categoryId = parseInt(data.categoryId, 10);

    const result = TransactionSchema.safeParse(data);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    await query({
      query: `UPDATE transactions SET amount=?, type=?, description=?, category_id=?, account_id=?, transaction_date=?, receipt_data=? WHERE id=? AND user_id=?`,
      values: [data.amount, data.type, data.description, data.categoryId, data.accountId, data.date, data.receipt_data || null, id, payload.userId]
    });

    return NextResponse.json({ message: 'Transaction Updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID Required' }, { status: 400 });

    await query({
      query: 'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      values: [id, payload.userId]
    });

    // LOGGING
    await logActivity(payload.userId, 'DELETE_TRANSACTION', `Deleted transaction ID: ${id}`);

    return NextResponse.json({ message: 'Transaction Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}