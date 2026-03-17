/**
 * PATCH /api/products/[id]/discount - Update product discount percentage.
 * Proxies to backend PATCH /api/v1/products/{id}/discount with body { percentage }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isRealApiMode, fetchBackend } from '@/lib/api-client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const percentage = Number(body?.percentage ?? body?.discountPercentage ?? 0);

    if (!isRealApiMode()) {
      return NextResponse.json(
        { error: 'Product discount requires API_URL to be configured' },
        { status: 501 }
      );
    }

    const token = (session as { accessToken?: string })?.accessToken;
    const { data, ok, status } = await fetchBackend<unknown>(
      `/api/v1/products/${id}/discount`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage }),
        token,
      }
    );

    if (!ok) {
      return NextResponse.json(
        data || { error: 'Failed to update discount' },
        { status: status || 500 }
      );
    }

    return NextResponse.json(data ?? { success: true });
  } catch (error) {
    console.error('[API] PATCH /products/[id]/discount error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
