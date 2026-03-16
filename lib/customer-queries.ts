import { query } from './db';

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  total_spent: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export async function getCustomers(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ customers: Customer[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)';
    params.push(`%${search}%`);
  }

  const offset = (page - 1) * limit;
  const paramIndex = params.length + 1;

  const [countResult, customersResult] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM customers WHERE ${whereClause}`,
      params
    ),
    query<Customer>(
      `
      SELECT *
      FROM customers
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    ),
  ]);

  return {
    customers: customersResult.rows,
    total: parseInt(countResult.rows[0]?.count || '0'),
  };
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const result = await query<Customer>(
    'SELECT * FROM customers WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getCustomerOrders(customerId: string) {
  const result = await query(
    `
    SELECT 
      id, order_number, total_amount, status, created_at
    FROM orders
    WHERE customer_id = $1
    ORDER BY created_at DESC
    `,
    [customerId]
  );
  return result.rows;
}
