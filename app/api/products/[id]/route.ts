import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProductById, updateProduct, deleteProduct } from '@/lib/product-queries';
import { isMockMode, MOCK_PRODUCTS } from '@/lib/mock-data';

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
      const product = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json(product);
    }

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('[Product API] GET error:', error);
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
      const product = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      return NextResponse.json({ ...product, ...body });
    }

    const product = await updateProduct(id, body);

    return NextResponse.json(product);
  } catch (error) {
    console.error('[Product API] PUT error:', error);
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

    await deleteProduct(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Product API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
