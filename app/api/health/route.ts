import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Simple query to check connection
    const result = await query({ 
        query: 'SELECT NOW() as time, DATABASE() as db_name' 
    });
    
    return NextResponse.json({ 
      status: 'online', 
      message: 'Database Connected Successfully 🚀', 
      data: result 
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}