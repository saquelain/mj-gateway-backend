import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { wallets, topupRequests } from '../../db/schema.js';
import { authenticateClient, type AuthenticatedClientRequest } from '../../middleware/clientAuth.js';
import { AppError } from '../../middleware/error.js';

export const clientTopupsRouter = Router();

clientTopupsRouter.post('/topups', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;
  const { amount, bankRef, transferMode, transferDate } = req.body;

  if (!amount || !bankRef) {
    throw new AppError(400, 'MISSING_FIELDS', 'amount and bankRef are required');
  }

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.clientId, clientId), eq(wallets.kind, 'recharge')))
    .limit(1);

  if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');

  const [inserted] = await db.insert(topupRequests).values({
    walletId: wallet.id,
    amount: Number(amount).toFixed(2),
    bankRef,
    transferMode,
    transferDate,
    status: 'pending',
    submittedBy: (req as AuthenticatedClientRequest).clientUser.id,
  });

  res.status(201).json({ topupRequestId: inserted.insertId, status: 'pending' });
});

clientTopupsRouter.get('/topups', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.clientId, clientId), eq(wallets.kind, 'recharge')))
    .limit(1);

  if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');

  const requests = await db
    .select()
    .from(topupRequests)
    .where(eq(topupRequests.walletId, wallet.id))
    .orderBy(topupRequests.id);

  res.json({ topupRequests: requests });
});