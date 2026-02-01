import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 1. Validation Schema (Security Layer)
const RegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 2. Validate Input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message }, 
        { status: 400 }
      );
    }

    const { fullName, email, password } = result.data;

    // 3. Check if user exists
    const existingUsers: any = await query({
      query: 'SELECT id FROM users WHERE email = ?',
      values: [email],
    });

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Insert New User
    const insertResult: any = await query({
      query: `INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)`,
      values: [fullName, email, hashedPassword],
    });

    const newUserId = insertResult.insertId;

    // 6. SETUP DEFAULTS (Improve User Experience)
    // Create a default "Cash Wallet"
    await query({
      query: `INSERT INTO accounts (user_id, name, type, balance, color) VALUES (?, ?, ?, ?, ?)`,
      values: [newUserId, 'Cash Wallet', 'WALLET', 0.00, '#10b981']
    });

    // Copy default categories to this user
    // (Since we are handling multi-tenancy manually without FKs)
    const defaults = [
      ['Salary', 'INCOME', 'wallet'],
      ['Food', 'EXPENSE', 'utensils'],
      ['Rent', 'EXPENSE', 'home'],
      ['Shopping', 'EXPENSE', 'shopping-bag'],
    ];

    for (const cat of defaults) {
      await query({
        query: `INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)`,
        values: [newUserId, cat[0], cat[1], cat[2]]
      });
    }

    return NextResponse.json({ 
      message: 'User registered successfully',
      userId: newUserId 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}