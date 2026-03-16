import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProducts, createProduct } from '@/lib/product-queries';
import { isMockMode, MOCK_PRODUCTS } from '@/lib/mock-data';

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
      let products = [...MOCK_PRODUCTS];
      if (search) {
        const s = search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.sku.toLowerCase().includes(s) ||
            (p.category_name || '').toLowerCase().includes(s)
        );
      }
      const total = products.length;
      const start = (page - 1) * limit;
      const paginated = products.slice(start, start + limit);
      return NextResponse.json({
        products: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const { products, total } = await getProducts(page, limit, search);

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Products API] GET error:', error);
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
      const mockProduct = {
        id: `mock-${Date.now()}`,
        name: body.name,
        sku: body.sku || `SKU-${Date.now()}`,
        category_name: body.category_name || 'Uncategorized',
        price: body.price || 0,
        is_active: true,
      };
      return NextResponse.json(mockProduct, { status: 201 });
    }

    const product = await createProduct(body);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('[Products API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
