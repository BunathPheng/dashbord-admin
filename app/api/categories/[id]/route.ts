import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { isMockMode } from '@/lib/mock-data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (isMockMode()) {
      return NextResponse.json({ id, name: body.name, description: body.description || '' });
    }

    const result = await query(
      `
      UPDATE categories
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, description
      `,
      [body.name, body.description || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[Category API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (isMockMode()) {
      return NextResponse.json({ id: 'mock-new', name: body.name, description: body.description || '' }, { status: 201 });
    }

    const result = await query(
      `
      INSERT INTO categories (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING id, name, description
      `,
      [body.name, body.description || null, true]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[Category API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (isMockMode()) {
      return NextResponse.json({ success: true });
    }

    await query('UPDATE categories SET is_active = false WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Category API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
