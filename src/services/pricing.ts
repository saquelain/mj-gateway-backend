import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

export async function getPrice(clientId: number, productId: number): Promise<number> {
  const [rows] = await db.execute(sql`
    SELECT COALESCE(cp.price, p.default_price) AS price
    FROM api_products p
    LEFT JOIN client_pricing cp
      ON cp.product_id = p.id AND cp.client_id = ${clientId}
    WHERE p.id = ${productId}
  `);
  const row = (rows as any[])[0];
  return Number(row.price);
}