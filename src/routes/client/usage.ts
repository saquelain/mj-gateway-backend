import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { apiCallLogs, apiProducts } from '../../db/schema.js';
import { authenticateClient, type AuthenticatedClientRequest } from '../../middleware/clientAuth.js';

export const clientUsageRouter = Router();

clientUsageRouter.get('/usage/summary', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;

  const [stats] = await db.execute(sql`
    SELECT
      COUNT(*) AS total_calls,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_calls,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_calls,
      SUM(CASE WHEN status = 'provider_down' THEN 1 ELSE 0 END) AS provider_down_calls,
      COALESCE(SUM(cost), 0) AS total_spent
    FROM api_call_logs
    WHERE client_id = ${clientId}
  `);

  res.json((stats as any[])[0]);
});

clientUsageRouter.get('/usage/logs', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const logs = await db
    .select({
      id: apiCallLogs.id,
      productName: apiProducts.name,
      status: apiCallLogs.status,
      cost: apiCallLogs.cost,
      httpStatus: apiCallLogs.httpStatus,
      durationMs: apiCallLogs.durationMs,
      createdAt: apiCallLogs.createdAt,
    })
    .from(apiCallLogs)
    .innerJoin(apiProducts, eq(apiCallLogs.productId, apiProducts.id))
    .where(eq(apiCallLogs.clientId, clientId))
    .orderBy(desc(apiCallLogs.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ page, limit, logs });
});