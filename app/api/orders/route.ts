import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrders } from '@/lib/order-queries';
import { isMockMode, MOCK_ORDERS } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;

    if (isMockMode()) {
      let orders = [...MOCK_ORDERS];
      if (status) orders = orders.filter((o) => o.status === status);
      const total = orders.length;
      const start = (page - 1) * limit;
      const paginated = orders.slice(start, start + limit);
      return NextResponse.json({
        orders: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const { orders, total } = await getOrders(page, limit, status);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Orders API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
