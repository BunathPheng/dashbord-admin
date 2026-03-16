import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCustomerById, getCustomerOrders } from '@/lib/customer-queries';
import { isMockMode, MOCK_CUSTOMER_DETAIL, MOCK_CUSTOMERS } from '@/lib/mock-data';

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
      const customer = MOCK_CUSTOMERS.find((c) => c.id === id);
      if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      return NextResponse.json({
        customer: { ...MOCK_CUSTOMER_DETAIL.customer, ...customer },
        orders: id === '1' ? MOCK_CUSTOMER_DETAIL.orders : [],
      });
    }

    const customer = await getCustomerById(id);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const orders = await getCustomerOrders(id);

    return NextResponse.json({ customer, orders });
  } catch (error) {
    console.error('[Customer API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
