import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { apiCallLogs } from '../../db/schema.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

export const adminUsageRouter = Router();

adminUsageRouter.get('/:clientId/usage', authenticateAdmin, async (req, res) => {
  const clientId = Number(req.params.clientId);

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