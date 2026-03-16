import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateInventory } from '@/lib/inventory-queries';
import { isMockMode, MOCK_INVENTORY } from '@/lib/mock-data';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const body = await request.json();

    if (isMockMode()) {
      const item = MOCK_INVENTORY.find((i) => i.product_id === productId);
      if (!item) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json({
        ...item,
        quantity_on_hand: body.quantity_on_hand ?? item.quantity_on_hand,
        quantity_reserved: body.quantity_reserved ?? item.quantity_reserved,
        low_stock_threshold: body.low_stock_threshold ?? item.low_stock_threshold,
        quantity_available: (body.quantity_on_hand ?? item.quantity_on_hand) - (body.quantity_reserved ?? item.quantity_reserved),
      });
    }

    const result = await updateInventory(productId, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Inventory API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
