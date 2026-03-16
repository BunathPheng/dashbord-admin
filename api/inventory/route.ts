import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getInventory } from '@/lib/inventory-queries';
import { isMockMode, MOCK_INVENTORY } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    if (isMockMode()) {
      let inventory = [...MOCK_INVENTORY];
      if (lowStockOnly) {
        inventory = inventory.filter((i) => i.quantity_available < i.low_stock_threshold);
      }
      const total = inventory.length;
      const start = (page - 1) * limit;
      const paginated = inventory.slice(start, start + limit);
      return NextResponse.json({
        inventory: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const { inventory, total } = await getInventory(page, limit, lowStockOnly);

    return NextResponse.json({
      inventory,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Inventory API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
