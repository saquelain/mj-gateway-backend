import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { wallets, walletTransactions, topupRequests, auditLog } from '../../db/schema.js';
import { authenticateAdmin, type AuthenticatedAdminRequest } from '../../middleware/adminAuth.js';
import { AppError } from '../../middleware/error.js';

export const adminTopupsRouter = Router();

// Create a pending top-up request (normally client-submitted; admin can also log one manually for now)
adminTopupsRouter.post('/', authenticateAdmin, async (req, res) => {
  const { walletId, amount, bankRef, transferMode, transferDate } = req.body;

  if (!walletId || !amount || !bankRef) {
    throw new AppError(400, 'MISSING_FIELDS', 'walletId, amount, bankRef are required');
  }

  const [inserted] = await db.insert(topupRequests).values({
    walletId,
    amount: Number(amount).toFixed(2),
    bankRef,
    transferMode,
    transferDate,
    status: 'pending',
  });

  res.status(201).json({ topupRequestId: inserted.insertId, status: 'pending' });
});

// Approve a pending top-up
adminTopupsRouter.post('/:id/approve', authenticateAdmin, async (req, res) => {
    const topupId = Number(req.params.id);
    const adminId = (req as AuthenticatedAdminRequest).admin.id;
    const ip = req.ip ?? '';
  
    await db.transaction(async (tx) => {
      const [reqRows] = await tx.execute(
        sql`SELECT * FROM topup_requests WHERE id = ${topupId} AND status = 'pending' FOR UPDATE`
      );
      const row = (reqRows as any[])[0];
      if (!row) throw new AppError(409, 'NOT_PENDING', 'Top-up not found or already processed');
  
      const [walletRows] = await tx.execute(
        sql`SELECT id, balance FROM wallets WHERE id = ${row.wallet_id} FOR UPDATE`
      );
      const walletRow = (walletRows as any[])[0];
      if (!walletRow) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');
  
      const newBalance = Number(walletRow.balance) + Number(row.amount);
  
      await tx.insert(walletTransactions).values({
        walletId: row.wallet_id,
        amount: Number(row.amount).toFixed(2),
        type: 'topup',
        reference: row.bank_ref,
        balanceAfter: newBalance.toFixed(2),
        notes: 'Bank transfer approved',
      });
  
      await tx.update(wallets)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(wallets.id, row.wallet_id));
  
      await tx.update(topupRequests)
        .set({ status: 'approved', reviewedBy: adminId, reviewedAt: new Date() })
        .where(eq(topupRequests.id, topupId));
  
      await tx.insert(auditLog).values({
        adminId,
        action: 'topup_approved',
        entityType: 'topup_request',
        entityId: String(topupId),
        newValue: { amount: row.amount, bankRef: row.bank_ref },
        ipAddress: ip,
      });
    });
  
    res.json({ topupRequestId: topupId, status: 'approved' });
  });