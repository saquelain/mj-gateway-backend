import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { wallets, walletTransactions } from '../../db/schema.js';
import { authenticateClient, type AuthenticatedClientRequest } from '../../middleware/clientAuth.js';
import { AppError } from '../../middleware/error.js';

export const clientWalletRouter = Router();

clientWalletRouter.get('/wallet', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.clientId, clientId), eq(wallets.kind, 'recharge')))
    .limit(1);

  if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');

  res.json({ walletId: wallet.id, balance: wallet.balance, currency: wallet.currency });
});

clientWalletRouter.get('/wallet/transactions', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.clientId, clientId), eq(wallets.kind, 'recharge')))
    .limit(1);

  if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');

  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ page, limit, transactions });
});