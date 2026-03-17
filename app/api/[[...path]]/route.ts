/**
 * Consolidated API route to stay under Vercel Hobby's 12 serverless function limit.
 * Handles: categories, products, orders, customers, discounts, inventory.
 * When API_URL is set, proxies to backend at http://localhost:9090 (or configured URL).
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import {
  isMockMode,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_ORDER_DETAIL,
  MOCK_CUSTOMERS,
  MOCK_CUSTOMER_DETAIL,
  MOCK_DISCOUNTS,
  MOCK_INVENTORY,
} from '@/lib/mock-data';
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from '@/lib/product-queries';
import { getOrders, getOrderById, updateOrderStatus } from '@/lib/order-queries';
import { getCustomers, getCustomerById, getCustomerOrders } from '@/lib/customer-queries';
import {
  getDiscounts,
  createDiscount,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
} from '@/lib/discount-queries';
import { getInventory, updateInventory } from '@/lib/inventory-queries';
import { getApiUrl, isRealApiMode, uploadFileToBackend, fetchBackend } from '@/lib/api-client';

type RouteParams = { params: Promise<{ path?: string[] }> };

async function checkAuth() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { path = [] } = await params;
  const [resource, sub, id] = path;

  try {
    // Files: GET /api/files/preview/[filename] - proxy to backend for image preview
    if (resource === 'files' && sub === 'preview' && id) {
      const baseUrl = getApiUrl();
      if (!baseUrl) {
        return NextResponse.json({ error: 'File preview not configured' }, { status: 503 });
      }
      const filename = path.slice(2).join('/') || id;
      const session = await auth();
      const token = (session as { accessToken?: string })?.accessToken;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }
      const res = await fetch(`${baseUrl}/api/v1/files/preview-file/${filename}`, {
        headers,
        cache: 'no-store',
      });
      if (!res.ok) {
        return new NextResponse(null, { status: res.status });
      }
      const blob = await res.blob();
      const contentType = res.headers.get('content-type') || 'image/png';
      return new NextResponse(blob, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // Categories: GET /api/categories or /api/categories/all
    if (resource === 'categories') {
      const data = isMockMode()
        ? MOCK_CATEGORIES
        : (await query('SELECT id, name, description FROM categories WHERE is_active = true ORDER BY name')).rows;
      return NextResponse.json(data);
    }

    // Products: GET /api/products (list) or /api/products/:id
    if (resource === 'products') {
      const productId = sub || id; // path is ['products','1'] so id is in sub
      if (productId) {
        if (isRealApiMode()) {
          const session = await auth();
          const token = (session as { accessToken?: string })?.accessToken;
          const { data, ok, status } = await fetchBackend<{ payload?: unknown; data?: unknown }>(
            `/api/v1/products/${productId}`,
            { token }
          );
          if (!ok) {
            return NextResponse.json(data || { error: 'Product not found' }, { status: status || 404 });
          }
          const p = (data?.payload ?? data?.data ?? data) as Record<string, unknown>;
          const mapped = {
            id: String(p?.id ?? productId),
            name: p?.name ?? '',
            description: p?.description ?? '',
            price: p?.price ?? 0,
            imageUrl: p?.imageUrl ?? p?.image_url ?? '',
            image_url: p?.imageUrl ?? p?.image_url ?? '',
            category: p?.category ?? '',
            category_name: p?.category ?? '',
            is_active: true,
          };
          return NextResponse.json(mapped);
        }
        if (isMockMode()) {
          const p = MOCK_PRODUCTS.find((x) => x.id === productId);
          if (!p) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          return NextResponse.json(p);
        }
        const product = await getProductById(productId);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json(product);
      }
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || undefined;
      const category = searchParams.get('category') || undefined;
      const sortPrice = searchParams.get('sortPrice') || undefined;
      const sortCreatedAt = searchParams.get('sortCreatedAt') || undefined;
      const newArrivals = searchParams.get('newArrivals') || undefined;
      const trending = searchParams.get('trending') || undefined;

      if (isRealApiMode()) {
        const session = await auth();
        const token = (session as { accessToken?: string })?.accessToken;
        const q = new URLSearchParams();
        if (category) q.set('category', category);
        if (search) q.set('name', search);
        if (sortPrice) q.set('sortPrice', sortPrice);
        if (sortCreatedAt) q.set('sortCreatedAt', sortCreatedAt);
        if (newArrivals) q.set('newArrivals', newArrivals);
        if (trending) q.set('trending', trending);
        const qs = q.toString();
        const { data, ok, status } = await fetchBackend<{
          success?: boolean;
          payload?: Array<Record<string, unknown>>;
          data?: Array<Record<string, unknown>>;
        }>(`/api/v1/products${qs ? `?${qs}` : ''}`, { token });
        if (!ok) {
          return NextResponse.json(data || { error: 'Failed to fetch products' }, { status: status || 502 });
        }
        const raw = data?.payload ?? data?.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        const products = arr.map((p) => ({
          id: String(p?.id ?? ''),
          name: p?.name ?? '',
          category_name: p?.category ?? '',
          price: Number(p?.price) ?? 0,
          is_active: true,
          imageUrl: p?.imageUrl ?? p?.image_url ?? '',
          description: p?.description ?? '',
          discountPercentage: Number(p?.discountPercentage ?? p?.discount_percentage ?? 0),
          onPromotion: Boolean(p?.onPromotion ?? p?.on_promotion ?? (Number(p?.discountPercentage ?? p?.discount_percentage ?? 0) > 0)),
        }));
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
        return NextResponse.json({
          products: products.slice(start, start + limit),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      }
      const { products, total } = await getProducts(page, limit, search);
      return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    // Orders: GET /api/orders (list) or /api/orders/:id
    if (resource === 'orders') {
      const orderId = sub || id; // path is ['orders','1'] so id is in sub
      if (orderId) {
        if (isRealApiMode()) {
          const session = await auth();
          const token = (session as { accessToken?: string })?.accessToken;
          const { data, ok, status } = await fetchBackend<{ payload?: unknown; data?: unknown }>(
            `/api/v1/orders/${orderId}`,
            { token }
          );
          if (!ok) {
            return NextResponse.json(data || { error: 'Order not found' }, { status: status || 404 });
          }
          let raw = data?.payload ?? data?.data ?? data;
          if (Array.isArray(raw) && raw.length > 0) raw = raw[0];
          const o = (raw ?? {}) as Record<string, unknown>;
          if (!o?.id && !o?.user && !o?.product) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }
          const user = (o?.user ?? {}) as Record<string, unknown>;
          const product = (o?.product ?? {}) as Record<string, unknown>;
          const mapped = {
            order: {
              id: String(o?.id ?? orderId),
              order_number: `ORD-${o?.id ?? orderId}`,
              first_name: String(user?.fullName ?? '').split(' ')[0] || '',
              last_name: String(user?.fullName ?? '').split(' ').slice(1).join(' ') || '',
              email: String(user?.email ?? ''),
              status: String(o?.status ?? 'pending'),
              payment_status: 'pending',
              total_amount: Number(o?.totalAmount ?? 0),
              subtotal: Number(o?.totalAmount ?? 0),
              tax: 0,
              shipping_cost: 0,
              discount_amount: 0,
              shipping_address: '',
              notes: '',
              created_at: String((o as { createdAt?: string })?.createdAt ?? new Date().toISOString()),
            },
            items: [
              {
                id: String(product?.id ?? '1'),
                product_name: String(product?.name ?? ''),
                product_imageUrl: String(product?.imageUrl ?? product?.image_url ?? ''),
                quantity: Number(o?.quantity ?? 0),
                unit_price: Number(product?.price ?? 0),
                total_price: Number(o?.totalAmount ?? 0),
              },
            ],
          };
          return NextResponse.json(mapped);
        }
        if (isMockMode()) {
          const o = MOCK_ORDERS.find((x) => x.id === orderId);
          if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          return NextResponse.json({ ...MOCK_ORDER_DETAIL, order: { ...MOCK_ORDER_DETAIL.order, ...o } });
        }
        const data = await getOrderById(orderId);
        if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        return NextResponse.json(data);
      }
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status') || undefined;
      if (isRealApiMode()) {
        const session = await auth();
        const token = (session as { accessToken?: string })?.accessToken;
        const q = new URLSearchParams();
        if (status) q.set('status', status);
        const qs = q.toString();
        const { data, ok, status: resStatus } = await fetchBackend<{
          payload?: Array<Record<string, unknown>>;
          data?: Array<Record<string, unknown>>;
        }>(`/api/v1/orders${qs ? `?${qs}` : ''}`, { token });
        if (!ok) {
          return NextResponse.json(data || { error: 'Failed to fetch orders' }, { status: resStatus || 502 });
        }
        const raw = data?.payload ?? data?.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        const orders = arr.map((o) => {
          const user = (o?.user ?? {}) as Record<string, unknown>;
          return {
            id: String(o?.id ?? ''),
            order_number: `ORD-${o?.id ?? ''}`,
            first_name: String(user?.fullName ?? '').split(' ')[0] || '',
            last_name: String(user?.fullName ?? '').split(' ').slice(1).join(' ') || '',
            email: String(user?.email ?? ''),
            total_amount: Number(o?.totalAmount ?? 0),
            status: String(o?.status ?? 'pending'),
            payment_status: 'pending',
            created_at: String((o as { createdAt?: string })?.createdAt ?? ''),
          };
        });
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
      if (isMockMode()) {
        let orders = [...MOCK_ORDERS];
        if (status) orders = orders.filter((o) => o.status === status);
        const total = orders.length;
        const start = (page - 1) * limit;
        return NextResponse.json({
          orders: orders.slice(start, start + limit),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      }
      const { orders, total } = await getOrders(page, limit, status);
      return NextResponse.json({ orders, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    // Customers: GET /api/customers (list) or /api/customers/:id
    if (resource === 'customers') {
      const customerId = sub || id; // path is ['customers','1'] so id is in sub
      if (customerId) {
        if (isMockMode()) {
          const c = MOCK_CUSTOMERS.find((x) => x.id === customerId);
          if (!c) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
          return NextResponse.json({
            customer: { ...MOCK_CUSTOMER_DETAIL.customer, ...c },
            orders: customerId === '1' ? MOCK_CUSTOMER_DETAIL.orders : [],
          });
        }
        const customer = await getCustomerById(customerId);
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        const orders = await getCustomerOrders(customerId);
        return NextResponse.json({ customer, orders });
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
        return NextResponse.json({
          customers: customers.slice(start, start + limit),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      }
      const { customers, total } = await getCustomers(page, limit, search);
      return NextResponse.json({ customers, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    // Discounts: GET /api/discounts (list) or /api/discounts/:id
    if (resource === 'discounts') {
      const discountId = sub || id; // path is ['discounts','1'] so id is in sub
      if (discountId) {
        if (isMockMode()) {
          const d = MOCK_DISCOUNTS.find((x) => x.id === discountId);
          if (!d) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
          return NextResponse.json(d);
        }
        const discount = await getDiscountById(discountId);
        if (!discount) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        return NextResponse.json(discount);
      }
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      if (isMockMode()) {
        const total = MOCK_DISCOUNTS.length;
        const start = (page - 1) * limit;
        return NextResponse.json({
          discounts: MOCK_DISCOUNTS.slice(start, start + limit),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      }
      const { discounts, total } = await getDiscounts(page, limit);
      return NextResponse.json({ discounts, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    // Inventory: GET /api/inventory
    if (resource === 'inventory') {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
      if (isMockMode()) {
        let inv = [...MOCK_INVENTORY];
        if (lowStockOnly) inv = inv.filter((i) => i.quantity_available < i.low_stock_threshold);
        const total = inv.length;
        const start = (page - 1) * limit;
        return NextResponse.json({
          inventory: inv.slice(start, start + limit),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      }
      const { inventory, total } = await getInventory(page, limit, lowStockOnly);
      return NextResponse.json({ inventory, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path = [] } = await params;
  const [resource, sub] = path;

  const authErr = await checkAuth();
  if (authErr) return authErr;

  try {
    if (resource === 'files' && sub === 'upload') {
      if (!getApiUrl()) {
        return NextResponse.json({ error: 'File upload requires API_URL to be configured' }, { status: 503 });
      }
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      const session = await auth();
      const token = (session as { accessToken?: string })?.accessToken;
      const result = await uploadFileToBackend(file, token);
      if (!result) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 502 });
      }
      return NextResponse.json({ success: true, fileUrl: result.fileUrl }, { status: 201 });
    }

    if (resource === 'categories') {
      const body = await request.json();
      if (isMockMode()) {
        return NextResponse.json(
          { id: 'mock-new', name: body.name, description: body.description || '' },
          { status: 201 }
        );
      }
      const result = await query(
        'INSERT INTO categories (name, description, is_active) VALUES ($1, $2, true) RETURNING id, name, description',
        [body.name, body.description || null]
      );
      return NextResponse.json(result.rows[0], { status: 201 });
    }

    if (resource === 'products') {
      const body = await request.json();
      if (isRealApiMode()) {
        const session = await auth();
        const token = (session as { accessToken?: string })?.accessToken;
        const category = body.category || 'OTHERS';
        const payload = {
          name: String(body.name || '').trim(),
          description: String(body.description || ''),
          price: parseFloat(body.price) || 0,
          imageUrl: String(body.imageUrl || body.image_url || ''),
        };
        const { data, ok, status } = await fetchBackend<unknown>(
          `/api/v1/products?category=${encodeURIComponent(category)}`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
            token,
          }
        );
        if (!ok) {
          const errMsg = (data as { message?: string; error?: string })?.message ?? (data as { message?: string; error?: string })?.error ?? 'Failed to create product';
          if (process.env.NODE_ENV === 'development') {
            console.error('[API] POST /products backend error:', status, data);
          }
          return NextResponse.json({ error: errMsg, details: data }, { status: status && status >= 400 ? status : 502 });
        }
        const result = (data as { payload?: unknown; data?: unknown })?.payload ?? (data as { payload?: unknown; data?: unknown })?.data ?? data;
        return NextResponse.json(result, { status: 201 });
      }
      if (isMockMode()) {
        const mock = {
          id: `mock-${Date.now()}`,
          name: body.name,
          sku: body.sku || `SKU-${Date.now()}`,
          category_name: body.category_name || body.category || 'Uncategorized',
          price: body.price || 0,
          is_active: true,
        };
        return NextResponse.json(mock, { status: 201 });
      }
      let categoryId = body.category_id;
      if (!categoryId && body.category) {
        const catKey = String(body.category).replace(/\s/g, '_').toUpperCase();
        const catResult = await query<{ id: string }>(
          "SELECT id FROM categories WHERE UPPER(REPLACE(name, ' ', '_')) = $1 AND is_active = true LIMIT 1",
          [catKey]
        );
        categoryId = catResult.rows[0]?.id;
        if (!categoryId) {
          const firstCat = await query<{ id: string }>('SELECT id FROM categories WHERE is_active = true LIMIT 1');
          categoryId = firstCat.rows[0]?.id || '';
        }
      }
      const product = await createProduct({
        name: body.name,
        description: body.description || '',
        category_id: categoryId || '',
        price: body.price ?? 0,
        cost: body.cost ?? 0,
        sku: body.sku || `SKU-${Date.now()}`,
        image_url: body.imageUrl || body.image_url,
      });
      return NextResponse.json(product, { status: 201 });
    }

    if (resource === 'discounts') {
      if (isRealApiMode()) {
        return NextResponse.json(
          { error: 'Product discounts use PATCH /api/products/{id}/discount' },
          { status: 405 }
        );
      }
      const body = await request.json();
      if (isMockMode()) {
        const mock = {
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
        return NextResponse.json(mock, { status: 201 });
      }
      const discount = await createDiscount(body);
      return NextResponse.json(discount, { status: 201 });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('[API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { path = [] } = await params;
  const [resource, subOrId, idOrProductId] = path;

  try {
    const body = await request.json();

    if (resource === 'categories' && subOrId && subOrId !== 'all') {
      const id = subOrId;
      if (isMockMode()) {
        return NextResponse.json({ id, name: body.name, description: body.description || '' });
      }
      const result = await query(
        'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, description',
        [body.name, body.description || null, id]
      );
      if (result.rows.length === 0) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      return NextResponse.json(result.rows[0]);
    }

    if (resource === 'products' && subOrId) {
      const id = subOrId;
      if (isRealApiMode()) {
        const session = await auth();
        const token = (session as { accessToken?: string })?.accessToken;
        const category = body.category || 'OTHERS';
        const { data, ok, status } = await fetchBackend<unknown>(
          `/api/v1/products/${id}?category=${encodeURIComponent(category)}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              name: body.name,
              description: body.description ?? '',
              price: body.price ?? 0,
              imageUrl: body.imageUrl || body.image_url || '',
            }),
            token,
          }
        );
        if (!ok) {
          return NextResponse.json(data || { error: 'Failed to update product' }, { status: status || 500 });
        }
        return NextResponse.json(data);
      }
      if (isMockMode()) {
        const p = MOCK_PRODUCTS.find((x) => x.id === id);
        if (!p) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json({ ...p, ...body });
      }
      const product = await updateProduct(id, body);
      return NextResponse.json(product);
    }

    if (resource === 'orders' && subOrId) {
      const id = subOrId;
      if (isRealApiMode()) {
        const session = await auth();
        const token = (session as { accessToken?: string })?.accessToken;
        const payload = body.status != null ? { status: body.status } : { productId: body.productId, quantity: body.quantity };
        const { data, ok, status } = await fetchBackend<unknown>(
          `/api/v1/orders/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
            token,
          }
        );
        if (!ok) {
          return NextResponse.json(data || { error: 'Failed to update order' }, { status: status || 500 });
        }
        return NextResponse.json(data ?? { success: true });
      }
      if (isMockMode()) {
        const o = MOCK_ORDERS.find((x) => x.id === id);
        if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        return NextResponse.json({ ...o, status: body.status || o.status });
      }
      const order = await updateOrderStatus(id, body.status, body.paymentStatus);
      return NextResponse.json(order);
    }

    if (resource === 'discounts' && subOrId) {
      const id = subOrId;
      if (isMockMode()) {
        const d = MOCK_DISCOUNTS.find((x) => x.id === id);
        if (!d) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        return NextResponse.json({ ...d, ...body });
      }
      const discount = await updateDiscount(id, body);
      return NextResponse.json(discount);
    }

    if (resource === 'inventory' && subOrId) {
      const productId = subOrId;
      if (isMockMode()) {
        const item = MOCK_INVENTORY.find((i) => i.product_id === productId);
        if (!item) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json({
          ...item,
          quantity_on_hand: body.quantity_on_hand ?? item.quantity_on_hand,
          quantity_reserved: body.quantity_reserved ?? item.quantity_reserved,
          low_stock_threshold: body.low_stock_threshold ?? item.low_stock_threshold,
          quantity_available:
            (body.quantity_on_hand ?? item.quantity_on_hand) - (body.quantity_reserved ?? item.quantity_reserved),
        });
      }
      const result = await updateInventory(productId, body);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('[API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { path = [] } = await params;
  const [resource, id] = path;

  try {
    if (resource === 'categories' && id && id !== 'all') {
      if (isMockMode()) return NextResponse.json({ success: true });
      await query('UPDATE categories SET is_active = false WHERE id = $1', [id]);
      return NextResponse.json({ success: true });
    }

    if (resource === 'products' && id) {
      if (isMockMode()) return NextResponse.json({ success: true });
      if (isRealApiMode()) {
        const session = await auth();
        const token = (session as { accessToken?: string })?.accessToken;
        const { data, ok, status } = await fetchBackend<unknown>(`/api/v1/products/${id}`, {
          method: 'DELETE',
          token,
        });
        if (!ok) {
          return NextResponse.json(data || { error: 'Failed to delete product' }, { status: status || 500 });
        }
        return NextResponse.json(data ?? { success: true });
      }
      await deleteProduct(id);
      return NextResponse.json({ success: true });
    }

    if (resource === 'discounts' && id) {
      if (isMockMode()) return NextResponse.json({ success: true });
      await deleteDiscount(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('[API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
