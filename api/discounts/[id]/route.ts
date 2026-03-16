import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDiscountById, updateDiscount, deleteDiscount } from '@/lib/discount-queries';
import { isMockMode, MOCK_DISCOUNTS } from '@/lib/mock-data';

export async function GET(
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
      const discount = MOCK_DISCOUNTS.find((d) => d.id === id);
      if (!discount) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      return NextResponse.json(discount);
    }

    const discount = await getDiscountById(id);

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error('[Discount API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      const discount = MOCK_DISCOUNTS.find((d) => d.id === id);
      if (!discount) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
      return NextResponse.json({ ...discount, ...body });
    }

    const discount = await updateDiscount(id, body);

    return NextResponse.json(discount);
  } catch (error) {
    console.error('[Discount API] PUT error:', error);
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

    await deleteDiscount(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Discount API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
