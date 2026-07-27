import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clientApiAccess, clientPricing, apiProducts, clients } from '../../db/schema.js';
import { authenticateAdmin, type AuthenticatedAdminRequest } from '../../middleware/adminAuth.js';
import { AppError } from '../../middleware/error.js';

export const adminAccessRouter = Router();

// Grant a client access to a product
adminAccessRouter.post('/:clientId/access', authenticateAdmin, async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { productCode } = req.body;
  const adminId = (req as AuthenticatedAdminRequest).admin.id;

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');

  const [product] = await db.select().from(apiProducts).where(eq(apiProducts.code, productCode)).limit(1);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  await db.insert(clientApiAccess).values({
    clientId,
    productId: product.id,
    enabledBy: adminId,
  }).onDuplicateKeyUpdate({
    set: { status: 'active', enabledBy: adminId, enabledAt: new Date() },
  });

  res.status(201).json({ clientId, productId: product.id, status: 'active' });
});

// Set client-specific pricing override for a product (optional)
adminAccessRouter.put('/:clientId/pricing', authenticateAdmin, async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { productCode, price } = req.body;
  const adminId = (req as AuthenticatedAdminRequest).admin.id;

  const [product] = await db.select().from(apiProducts).where(eq(apiProducts.code, productCode)).limit(1);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  await db.insert(clientPricing).values({
    clientId,
    productId: product.id,
    price: Number(price).toFixed(2),
    updatedBy: adminId,
  }).onDuplicateKeyUpdate({
    set: { price: Number(price).toFixed(2), updatedBy: adminId },
  });

  res.json({ clientId, productId: product.id, price });
});

adminAccessRouter.get('/:clientId/access', authenticateAdmin, async (req, res) => {
    const clientId = Number(req.params.clientId);
  
    const rows = await db.execute(sql`
      SELECT
        p.id AS product_id,
        p.code,
        p.name,
        p.default_price,
        ca.status AS access_status,
        COALESCE(cp.price, p.default_price) AS effective_price,
        cp.price AS custom_price
      FROM api_products p
      LEFT JOIN client_api_access ca ON ca.product_id = p.id AND ca.client_id = ${clientId}
      LEFT JOIN client_pricing cp ON cp.product_id = p.id AND cp.client_id = ${clientId}
      WHERE p.status = 'active'
      ORDER BY p.id
    `);
  
    res.json({ products: rows[0] });
  });