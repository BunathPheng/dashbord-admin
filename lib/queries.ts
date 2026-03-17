import { auth } from '@/auth';
import { query } from './db';
import {
  isMockMode,
  MOCK_STATS,
  MOCK_SALES_DATA,
  MOCK_RECENT_ORDERS,
  MOCK_LOW_STOCK_PRODUCTS,
} from './mock-data';
import { isRealApiMode, fetchDashboardFromBackend, fetchBackend } from './api-client';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // Prefer API when configured (API_URL), so dashboard matches backend data
  if (isRealApiMode()) {
    const session = await auth();
    const token = (session as { accessToken?: string })?.accessToken;
    const apiStats = await fetchDashboardFromBackend(token);
    return {
      totalRevenue: apiStats?.totalRevenue ?? 0,
      totalOrders: apiStats?.totalOrders ?? 0,
      totalCustomers: apiStats?.totalCustomers ?? 0,
      totalProducts: 0,
      lowStockProducts: 0,
    };
  }

  if (isMockMode()) return MOCK_STATS;

  const results = await Promise.all([
    query<{ total: string }>(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != $1',
      ['cancelled']
    ),
    query<{ count: string }>(
      'SELECT COUNT(*) as count FROM orders WHERE status != $1',
      ['cancelled']
    ),
    query<{ count: string }>('SELECT COUNT(*) as count FROM customers'),
  ]);

  return {
    totalRevenue: parseFloat(results[0].rows[0]?.total || '0'),
    totalOrders: parseInt(results[1].rows[0]?.count || '0'),
    totalCustomers: parseInt(results[2].rows[0]?.count || '0'),
    totalProducts: 0,
    lowStockProducts: 0,
  };
}

export async function getSalesData(days: number = 30): Promise<SalesData[]> {
  if (isMockMode()) return MOCK_SALES_DATA;
  if (isRealApiMode()) return []; // Backend may not expose sales chart data

  const result = await query<SalesData>(
    `
    SELECT 
      DATE(created_at) as date,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    AND status != 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
    `,
    [days]
  );

  return result.rows.map((row) => ({
    date: new Date(row.date).toISOString().split('T')[0],
    revenue: parseFloat(row.revenue as any),
    orders: parseInt(row.orders as any),
  }));
}

export async function getRecentOrders(limit: number = 10) {
  if (isMockMode()) return MOCK_RECENT_ORDERS.slice(0, limit);
  if (isRealApiMode()) {
    const session = await auth();
    const token = (session as { accessToken?: string })?.accessToken;
    const { data, ok } = await fetchBackend<{
      payload?: Array<Record<string, unknown>>;
      data?: Array<Record<string, unknown>>;
    }>('/api/v1/orders', { token });
    if (!ok) return [];
    const raw = data?.payload ?? data?.data ?? [];
    const arr = Array.isArray(raw) ? raw : [];
    return arr.slice(0, limit).map((o) => {
      const user = (o?.user ?? {}) as Record<string, unknown>;
      return {
        id: String(o?.id ?? ''),
        order_number: `ORD-${o?.id ?? ''}`,
        first_name: String(user?.fullName ?? '').split(' ')[0] || '',
        last_name: String(user?.fullName ?? '').split(' ').slice(1).join(' ') || '',
        email: String(user?.email ?? ''),
        total_amount: Number(o?.totalAmount ?? 0),
        status: String(o?.status ?? 'pending'),
        created_at: String((o as { createdAt?: string })?.createdAt ?? ''),
      };
    });
  }

  const result = await query(
    `
    SELECT 
      o.id,
      o.order_number,
      o.total_amount,
      o.status,
      o.created_at,
      c.first_name,
      c.last_name,
      c.email
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

export async function getLowStockProducts(limit: number = 10) {
  if (isMockMode()) return MOCK_LOW_STOCK_PRODUCTS.slice(0, limit);
  if (isRealApiMode()) return []; // Backend may not expose inventory

  const result = await query(
    `
    SELECT 
      p.id,
      p.name,
      p.sku,
      i.quantity_on_hand,
      i.low_stock_threshold
    FROM products p
    JOIN inventory i ON p.id = i.product_id
    WHERE i.quantity_available < i.low_stock_threshold
    ORDER BY i.quantity_available ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}
