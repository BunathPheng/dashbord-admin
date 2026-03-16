import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { isMockMode, MOCK_CATEGORIES } from '@/lib/mock-data';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isMockMode()) {
      return NextResponse.json(MOCK_CATEGORIES);
    }

    const result = await query(
      'SELECT id, name, description FROM categories WHERE is_active = true ORDER BY name'
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[Categories All API] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
