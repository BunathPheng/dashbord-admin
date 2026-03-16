import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCustomers } from '@/lib/customer-queries';
import { isMockMode, MOCK_CUSTOMERS } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    if (isMockMode()) {
      let customers = [...MOCK_CUSTOMERS];
      if (search) {
        const s = search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.email.toLowerCase().includes(s) ||
            c.first_name.toLowerCase().includes(s) ||
            c.last_name.toLowerCase().includes(s)
        );
      }
      const total = customers.length;
      const start = (page - 1) * limit;
      const paginated = customers.slice(start, start + limit);
      return NextResponse.json({
        customers: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const { customers, total } = await getCustomers(page, limit, search);

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Customers API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
