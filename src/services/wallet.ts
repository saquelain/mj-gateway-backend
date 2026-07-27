import { sql, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { wallets, walletTransactions } from '../db/schema.js';
import { AppError } from '../middleware/error.js';

export async function debitWallet(
    walletId: number,
    amount: number,
    reference: string
  ): Promise<number> {
    return await db.transaction(async (tx) => {
      const [rows] = await tx.execute(
        sql`SELECT id, balance FROM wallets WHERE id = ${walletId} FOR UPDATE`
      );
      const wallet = (rows as any[])[0];
      if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');
  
      const balance = Number(wallet.balance);
      if (balance < amount) {
        throw new AppError(402, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
      }
  
      const newBalance = balance - amount;
  
      await tx.insert(walletTransactions).values({
        walletId,
        amount: (-amount).toFixed(2),
        type: 'debit',
        reference,
        balanceAfter: newBalance.toFixed(2),
      });
  
      await tx.update(wallets)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(wallets.id, walletId));
  
      return newBalance;
    });
  }