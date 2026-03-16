import { query } from './db';

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  low_stock_threshold: number;
}

export async function getInventory(
  page: number = 1,
  limit: number = 10,
  lowStockOnly: boolean = false
): Promise<{ inventory: InventoryItem[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];

  if (lowStockOnly) {
    whereClause += ' AND i.quantity_available < i.low_stock_threshold';
  }

  const offset = (page - 1) * limit;
  const paramIndex = params.length + 1;

  const [countResult, inventoryResult] = await Promise.all([
    query<{ count: string }>(
      `
      SELECT COUNT(*) as count FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE ${whereClause}
      `,
      params
    ),
    query<InventoryItem>(
      `
      SELECT 
        i.id, i.product_id, p.name as product_name, p.sku,
        i.quantity_on_hand, i.quantity_reserved, i.quantity_available, i.low_stock_threshold
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE ${whereClause}
      ORDER BY CASE WHEN i.quantity_available < i.low_stock_threshold THEN 0 ELSE 1 END,
               i.quantity_available ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      [...params, limit, offset]
    ),
  ]);

  return {
    inventory: inventoryResult.rows,
    total: parseInt(countResult.rows[0]?.count || '0'),
  };
}

export async function updateInventory(
  productId: string,
  data: {
    quantity_on_hand?: number;
    quantity_reserved?: number;
    low_stock_threshold?: number;
  }
): Promise<InventoryItem> {
  const updates = ['updated_at = CURRENT_TIMESTAMP'];
  const params = [productId];
  let paramIndex = 2;

  if (data.quantity_on_hand !== undefined) {
    updates.push(`quantity_on_hand = $${paramIndex}`);
    params.push(data.quantity_on_hand);
    paramIndex++;
  }

  if (data.quantity_reserved !== undefined) {
    updates.push(`quantity_reserved = $${paramIndex}`);
    params.push(data.quantity_reserved);
    paramIndex++;
  }

  if (data.low_stock_threshold !== undefined) {
    updates.push(`low_stock_threshold = $${paramIndex}`);
    params.push(data.low_stock_threshold);
    paramIndex++;
  }

  // Update quantity_available
  updates.push(`quantity_available = quantity_on_hand - quantity_reserved`);

  const result = await query<any>(
    `
    UPDATE inventory
    SET ${updates.join(', ')}
    WHERE product_id = $1
    RETURNING id, product_id, quantity_on_hand, quantity_reserved, quantity_available, low_stock_threshold
    `,
    params
  );

  return result.rows[0];
}
