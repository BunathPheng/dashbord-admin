import { query } from './db';

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  cost: number;
  sku: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category_name: string;
}

export async function getProducts(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ products: ProductWithCategory[]; total: number }> {
  let whereClause = 'WHERE p.is_active = true';
  const params: any[] = [];

  if (search) {
    whereClause += ' AND (p.name ILIKE $1 OR p.sku ILIKE $1 OR p.description ILIKE $1)';
    params.push(`%${search}%`);
  }

  const offset = (page - 1) * limit;
  const paramIndex = params.length + 1;

  const [countResult, productsResult] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products p ${whereClause}`,
      params
    ),
    query<ProductWithCategory>(
      `
      SELECT 
        p.id, p.name, p.description, p.category_id, p.price, p.cost, p.sku, p.image_url, p.is_active, p.created_at, p.updated_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    ),
  ]);

  return {
    products: productsResult.rows,
    total: parseInt(countResult.rows[0]?.count || '0'),
  };
}

export async function getProductById(id: string): Promise<ProductWithCategory | null> {
  const result = await query<ProductWithCategory>(
    `
    SELECT 
      p.id, p.name, p.description, p.category_id, p.price, p.cost, p.sku, p.image_url, p.is_active, p.created_at, p.updated_at,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = $1
    `,
    [id]
  );
  return result.rows[0] || null;
}

export async function createProduct(data: {
  name: string;
  description: string;
  category_id: string;
  price: number;
  cost: number;
  sku: string;
  image_url?: string;
}): Promise<Product> {
  const result = await query<Product>(
    `
    INSERT INTO products (name, description, category_id, price, cost, sku, image_url, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      data.name,
      data.description,
      data.category_id,
      data.price,
      data.cost,
      data.sku,
      data.image_url || null,
      true,
    ]
  );
  return result.rows[0];
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    category_id: string;
    price: number;
    cost: number;
    sku: string;
    image_url: string;
    is_active: boolean;
  }>
): Promise<Product> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });

  params.push(id);
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await query<Product>(
    `
    UPDATE products
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
    `,
    params
  );

  return result.rows[0];
}

export async function deleteProduct(id: string): Promise<void> {
  await query('UPDATE products SET is_active = false WHERE id = $1', [id]);
}

export async function getCategories() {
  const result = await query(
    'SELECT id, name FROM categories WHERE is_active = true ORDER BY name'
  );
  return result.rows;
}
