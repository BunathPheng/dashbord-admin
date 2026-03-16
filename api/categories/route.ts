import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT id, name FROM categories WHERE is_active = true ORDER BY name'
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[Categories API] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
