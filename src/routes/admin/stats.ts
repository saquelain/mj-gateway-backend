import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

export const adminStatsRouter = Router();

adminStatsRouter.get('/overview', authenticateAdmin, async (_req, res) => {
  const [clientStats] = await db.execute(sql`
    SELECT
      COUNT(*) AS total_clients,
      SUM(CASE WHEN kyc_status = 'pending' THEN 1 ELSE 0 END) AS pending_kyc,
      SUM(CASE WHEN kyc_status = 'verified' THEN 1 ELSE 0 END) AS verified_clients
    FROM clients
  `);

  const [topupStats] = await db.execute(sql`
    SELECT COUNT(*) AS pending_topups
    FROM topup_requests
    WHERE status = 'pending'
  `);

  const [callStats] = await db.execute(sql`
    SELECT
      COUNT(*) AS total_api_calls,
      COALESCE(SUM(cost), 0) AS total_revenue
    FROM api_call_logs
    WHERE status = 'success'
  `);

  res.json({
    ...(clientStats as any[])[0],
    ...(topupStats as any[])[0],
    ...(callStats as any[])[0],
  });
});