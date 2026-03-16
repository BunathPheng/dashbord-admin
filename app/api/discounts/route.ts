import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDiscounts, createDiscount } from '@/lib/discount-queries';
import { isMockMode, MOCK_DISCOUNTS } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (isMockMode()) {
      const total = MOCK_DISCOUNTS.length;
      const start = (page - 1) * limit;
      const paginated = MOCK_DISCOUNTS.slice(start, start + limit);
      return NextResponse.json({
        discounts: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const { discounts, total } = await getDiscounts(page, limit);

    return NextResponse.json({
      discounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Discounts API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (isMockMode()) {
      const mockDiscount = {
        id: `mock-${Date.now()}`,
        code: body.code || 'MOCK',
        description: body.description || '',
        discount_type: body.discount_type || 'percentage',
        discount_value: body.discount_value || 10,
        max_uses: body.max_uses ?? null,
        current_uses: 0,
        is_active: true,
        start_date: body.start_date ?? null,
        end_date: body.end_date ?? null,
      };
      return NextResponse.json(mockDiscount, { status: 201 });
    }

    const discount = await createDiscount(body);

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('[Discounts API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
