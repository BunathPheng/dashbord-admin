/**
 * Consolidated API route to stay under Vercel Hobby's 12 serverless function limit.
 * Handles: categories, products, orders, customers, discounts, inventory.
 * Auth routes (auth/[...nextauth], auth/verify) remain separate.
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
    // Categories: GET /api/categories or /api/categories/all
    if (resource === 'categories') {
      const data = isMockMode()
        ? MOCK_CATEGORIES
        : (await query('SELECT id, name, description FROM categories WHERE is_active = true ORDER BY name')).rows;
      return NextResponse.json(data);
    }

    // Products: GET /api/products (list) or /api/products/:id
    if (resource === 'products') {
      if (id) {
        if (isMockMode()) {
          const p = MOCK_PRODUCTS.find((x) => x.id === id);
          if (!p) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          return NextResponse.json(p);
        }
        const product = await getProductById(id);
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json(product);
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
      if (id) {
        if (isMockMode()) {
          const o = MOCK_ORDERS.find((x) => x.id === id);
          if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          return NextResponse.json({ ...MOCK_ORDER_DETAIL, order: { ...MOCK_ORDER_DETAIL.order, ...o } });
        }
        const data = await getOrderById(id);
        if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        return NextResponse.json(data);
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
      if (id) {
        if (isMockMode()) {
          const c = MOCK_CUSTOMERS.find((x) => x.id === id);
          if (!c) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
          return NextResponse.json({
            customer: { ...MOCK_CUSTOMER_DETAIL.customer, ...c },
            orders: id === '1' ? MOCK_CUSTOMER_DETAIL.orders : [],
          });
        }
        const customer = await getCustomerById(id);
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        const orders = await getCustomerOrders(id);
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
      if (id) {
        if (isMockMode()) {
          const d = MOCK_DISCOUNTS.find((x) => x.id === id);
          if (!d) return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
          return NextResponse.json(d);
        }
        const discount = await getDiscountById(id);
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
  const authErr = await checkAuth();
  if (authErr) return authErr;

  const { path = [] } = await params;
  const [resource] = path;

  try {
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
      if (isMockMode()) {
        const mock = {
          id: `mock-${Date.now()}`,
          name: body.name,
          sku: body.sku || `SKU-${Date.now()}`,
          category_name: body.category_name || 'Uncategorized',
          price: body.price || 0,
          is_active: true,
        };
        return NextResponse.json(mock, { status: 201 });
      }
      const product = await createProduct(body);
      return NextResponse.json(product, { status: 201 });
    }

    if (resource === 'discounts') {
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
