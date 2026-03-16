import { query } from './db';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount_amount: number;
  payment_status: string;
  shipping_address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithCustomer extends Order {
  first_name: string;
  last_name: string;
  email: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function getOrders(
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<{ orders: OrderWithCustomer[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND o.status = $1';
    params.push(status);
  }

  const offset = (page - 1) * limit;
  const paramIndex = params.length + 1;

  const [countResult, ordersResult] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders o WHERE ${whereClause}`,
      params
    ),
    query<OrderWithCustomer>(
      `
      SELECT 
        o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.subtotal, 
        o.tax, o.shipping_cost, o.discount_amount, o.payment_status, o.shipping_address, 
        o.notes, o.created_at, o.updated_at,
        c.first_name, c.last_name, c.email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    ),
  ]);

  return {
    orders: ordersResult.rows,
    total: parseInt(countResult.rows[0]?.count || '0'),
  };
}

export async function getOrderById(id: string) {
  const [orderResult, itemsResult] = await Promise.all([
    query<OrderWithCustomer>(
      `
      SELECT 
        o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.subtotal, 
        o.tax, o.shipping_cost, o.discount_amount, o.payment_status, o.shipping_address, 
        o.notes, o.created_at, o.updated_at,
        c.first_name, c.last_name, c.email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
      `,
      [id]
    ),
    query<OrderItem>(
      `
      SELECT 
        oi.id, oi.order_id, oi.product_id, p.name as product_name,
        oi.quantity, oi.unit_price, oi.total_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      `,
      [id]
    ),
  ]);

  if (!orderResult.rows[0]) return null;

  return {
    order: orderResult.rows[0],
    items: itemsResult.rows,
  };
}

export async function updateOrderStatus(
  id: string,
  status: string,
  paymentStatus?: string
): Promise<Order> {
  const updates = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [id, status];

  if (paymentStatus) {
    updates.push(`payment_status = $${params.length + 1}`);
    params.push(paymentStatus);
  }

  const result = await query<Order>(
    `
    UPDATE orders
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *
    `,
    params
  );

  return result.rows[0];
}
