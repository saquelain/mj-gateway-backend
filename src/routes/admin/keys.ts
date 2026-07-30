import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { apiKeys, clients } from '../../db/schema.js';
import { generateApiKey } from '../../services/apiKeys.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';
import { AppError } from '../../middleware/error.js';

export const adminKeysRouter = Router();

adminKeysRouter.post('/:clientId/keys', authenticateAdmin, async (req, res) => {
    const clientId = Number(req.params.clientId);
    const { label, mode } = req.body;
  
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!client) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  
    const { id, rawKey } = await generateApiKey(clientId, label, mode === 'test' ? 'test' : 'live');
  
    res.status(201).json({
      keyId: id,
      apiKey: rawKey,
      mode: mode === 'test' ? 'test' : 'live',
      warning: 'Save this key now. It will not be shown again.',
    });
  });

adminKeysRouter.get('/:clientId/keys', authenticateAdmin, async (req, res) => {
    const clientId = Number(req.params.clientId);
  
    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        label: apiKeys.label,
        mode: apiKeys.mode,
        status: apiKeys.status,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.clientId, clientId))
      .orderBy(apiKeys.id);
  
    res.json({ keys });
  });
  
  adminKeysRouter.post('/:clientId/keys/:keyId/revoke', authenticateAdmin, async (req, res) => {
    const keyId = Number(req.params.keyId);
  
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
    if (!key) throw new AppError(404, 'KEY_NOT_FOUND', 'API key not found');
  
    await db.update(apiKeys).set({ status: 'revoked' }).where(eq(apiKeys.id, keyId));
  
    res.json({ keyId, status: 'revoked' });
  });