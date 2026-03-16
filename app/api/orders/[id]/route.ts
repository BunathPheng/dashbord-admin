import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrderById, updateOrderStatus } from '@/lib/order-queries';
import { isMockMode, MOCK_ORDER_DETAIL, MOCK_ORDERS } from '@/lib/mock-data';

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
      const order = MOCK_ORDERS.find((o) => o.id === id);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      return NextResponse.json({
        ...MOCK_ORDER_DETAIL,
        order: { ...MOCK_ORDER_DETAIL.order, ...order },
      });
    }

    const data = await getOrderById(id);

    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Order API] GET error:', error);
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
      const order = MOCK_ORDERS.find((o) => o.id === id);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      return NextResponse.json({ ...order, status: body.status || order.status });
    }

    const order = await updateOrderStatus(id, body.status, body.paymentStatus);

    return NextResponse.json(order);
  } catch (error) {
    console.error('[Order API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
