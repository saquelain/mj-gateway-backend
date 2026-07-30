import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { apiProducts, clientApiAccess, wallets, apiCallLogs } from '../../db/schema.js';
import { authenticateApiKey, type AuthenticatedApiRequest } from '../../middleware/apiKeyAuth.js';
import { getPrice } from '../../services/pricing.js';
import { debitWallet } from '../../services/wallet.js';
import { verifyPan } from '../../providers/surepass.js';
import { mask } from '../../services/mask.js';
import { AppError } from '../../middleware/error.js';
import { rateLimit } from '../../middleware/rateLimit.js';

export const panVerifyRouter = Router();

panVerifyRouter.post('/pan-verify', authenticateApiKey, rateLimit, async (req, res) => {
    const { apiClient, apiKeyId, apiKeyMode } = req as AuthenticatedApiRequest;
    const { panNumber } = req.body;
  
    if (apiClient.status !== 'active') {
      throw new AppError(403, 'CLIENT_SUSPENDED', 'Client account is not active');
    }
  
    if (apiClient.kycStatus !== 'verified') {
      throw new AppError(403, 'KYC_NOT_VERIFIED', 'Client KYC is not verified');
    }
  
    const [product] = await db.select().from(apiProducts).where(eq(apiProducts.code, 'pan_verify')).limit(1);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not configured');
  
    const [access] = await db
      .select()
      .from(clientApiAccess)
      .where(and(
        eq(clientApiAccess.clientId, apiClient.id),
        eq(clientApiAccess.productId, product.id),
        eq(clientApiAccess.status, 'active'),
      ))
      .limit(1);
    if (!access) throw new AppError(403, 'ACCESS_DENIED', 'No access to this product');
  
    const price = await getPrice(apiClient.id, product.id);
    const isTestMode = apiKeyMode === 'test';
  
    // Balance check skipped entirely in test mode — sandbox calls never touch real funds
    if (!isTestMode) {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.clientId, apiClient.id)).limit(1);
      if (!wallet) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet not found');
      if (Number(wallet.balance) < price) {
        throw new AppError(402, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
      }
    }
  
    const startTime = Date.now();
    const providerResponse = await verifyPan(panNumber);
    const durationMs = Date.now() - startTime;
  
    if (!providerResponse.success) {
      await db.insert(apiCallLogs).values({
        clientId: apiClient.id,
        productId: product.id,
        apiKeyId,
        requestBody: mask({ panNumber }),
        responseBody: mask(providerResponse.data ?? {}),
        providerName: 'surepass',
        httpStatus: providerResponse.httpStatus,
        status: 'provider_down',
        cost: '0.00',
        durationMs,
        clientIp: req.ip,
      });
      throw new AppError(503, 'PROVIDER_ERROR', 'Provider request failed');
    }
  
    const loggedCost = isTestMode ? '0.00' : price.toFixed(2);
  
    const [logInsert] = await db.insert(apiCallLogs).values({
      clientId: apiClient.id,
      productId: product.id,
      apiKeyId,
      requestBody: mask({ panNumber }),
      responseBody: mask(providerResponse.data ?? {}),
      providerName: isTestMode ? 'surepass_sandbox' : 'surepass',
      providerRef: providerResponse.providerRef,
      httpStatus: providerResponse.httpStatus,
      status: 'success',
      cost: loggedCost,
      durationMs,
      clientIp: req.ip,
    });
  
    // Debit only in live mode — test mode never touches the wallet
    if (!isTestMode) {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.clientId, apiClient.id)).limit(1);
      await debitWallet(wallet!.id, price, `api_call_${logInsert.insertId}`);
    }
  
    res.json({ success: true, data: providerResponse.data, cost: isTestMode ? 0 : price, mode: apiKeyMode });
  });