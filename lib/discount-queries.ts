import { query } from './db';

export interface Discount {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function getDiscounts(
  page: number = 1,
  limit: number = 10
): Promise<{ discounts: Discount[]; total: number }> {
  const offset = (page - 1) * limit;

  const [countResult, discountsResult] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) as count FROM discounts'),
    query<Discount>(
      `
      SELECT *
      FROM discounts
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    ),
  ]);

  return {
    discounts: discountsResult.rows,
    total: parseInt(countResult.rows[0]?.count || '0'),
  };
}

export async function getDiscountById(id: string): Promise<Discount | null> {
  const result = await query<Discount>('SELECT * FROM discounts WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createDiscount(data: {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses?: number;
  start_date?: string;
  end_date?: string;
}): Promise<Discount> {
  const result = await query<Discount>(
    `
    INSERT INTO discounts (code, description, discount_type, discount_value, max_uses, is_active, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      data.code,
      data.description,
      data.discount_type,
      data.discount_value,
      data.max_uses || null,
      true,
      data.start_date || null,
      data.end_date || null,
    ]
  );
  return result.rows[0];
}

export async function updateDiscount(
  id: string,
  data: Partial<{
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number;
    is_active: boolean;
    start_date: string;
    end_date: string;
  }>
): Promise<Discount> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      params.push(value === '' ? null : value);
      paramIndex++;
    }
  });

  params.push(id);
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await query<Discount>(
    `
    UPDATE discounts
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
    `,
    params
  );

  return result.rows[0];
}

export async function deleteDiscount(id: string): Promise<void> {
  await query('DELETE FROM discounts WHERE id = $1', [id]);
}

export async function validateDiscount(code: string): Promise<Discount | null> {
  const result = await query<Discount>(
    `
    SELECT * FROM discounts
    WHERE code = $1
    AND is_active = true
    AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
    AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
    AND (max_uses IS NULL OR current_uses < max_uses)
    LIMIT 1
    `,
    [code]
  );
  return result.rows[0] || null;
}
