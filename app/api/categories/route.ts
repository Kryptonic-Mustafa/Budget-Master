import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { z } from 'zod';

const CategorySchema = z.object({
  name: z.string().min(2),
  type: z.enum(['INCOME', 'EXPENSE']),
  budget_limit: z.number().min(0).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// GET: Fetch Categories with "Spent So Far"
export async function GET(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = payload.userId;

    const categories: any = await query({
      query: `
        SELECT 
          c.*,
          COALESCE(SUM(t.amount), 0) as spent
        FROM categories c
        LEFT JOIN transactions t 
          ON c.id = t.category_id 
          AND t.transaction_date BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND LAST_DAY(NOW())
        WHERE c.user_id = ? OR c.user_id IS NULL
        GROUP BY c.id
        ORDER BY c.type, c.name
      `,
      values: [userId]
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create New Category
export async function POST(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (typeof body.budget_limit === 'string') body.budget_limit = parseFloat(body.budget_limit);

    const result = CategorySchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

    const { name, type, budget_limit, color, icon } = result.data;

    const insert: any = await query({
      query: `INSERT INTO categories (user_id, name, type, budget_limit, color, icon) VALUES (?, ?, ?, ?, ?, ?)`,
      values: [payload.userId, name, type, budget_limit || 0, color || '#64748b', icon || 'circle']
    });

    return NextResponse.json({ message: 'Category Created', id: insert.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update Budget Limit
export async function PUT(req: Request) {
    try {
      const token = cookies().get('auth_token')?.value;
      const payload: any = verifyToken(token || '');
      if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
      const body = await req.json();
      const { id, budget_limit, color } = body;
  
      await query({
        query: `UPDATE categories SET budget_limit = ?, color = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        values: [parseFloat(budget_limit), color, id, payload.userId]
      });
  
      return NextResponse.json({ message: 'Category Updated' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove Category (THIS WAS MISSING)
export async function DELETE(req: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    const payload: any = verifyToken(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID Required' }, { status: 400 });

    // Ensure we only delete categories belonging to this user
    await query({
      query: 'DELETE FROM categories WHERE id = ? AND user_id = ?',
      values: [id, payload.userId]
    });

    return NextResponse.json({ message: 'Category Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}