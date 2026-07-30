import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { apiKeys } from '../../db/schema.js';
import { generateApiKey } from '../../services/apiKeys.js';
import { authenticateClient, type AuthenticatedClientRequest } from '../../middleware/clientAuth.js';
import { AppError } from '../../middleware/error.js';

export const clientKeysRouter = Router();

clientKeysRouter.get('/keys', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;

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

clientKeysRouter.post('/keys', authenticateClient, async (req, res) => {
    const { clientId } = (req as AuthenticatedClientRequest).clientUser;
    const { label, mode } = req.body;
  
    const { id, rawKey } = await generateApiKey(clientId, label, mode === 'test' ? 'test' : 'live');
  
    res.status(201).json({
      keyId: id,
      apiKey: rawKey,
      mode: mode === 'test' ? 'test' : 'live',
      warning: 'Save this key now. It will not be shown again.',
    });
  });

clientKeysRouter.post('/keys/:keyId/revoke', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;
  const keyId = Number(req.params.keyId);

  const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
  if (!key || key.clientId !== clientId) {
    throw new AppError(404, 'KEY_NOT_FOUND', 'API key not found');
  }

  await db.update(apiKeys).set({ status: 'revoked' }).where(eq(apiKeys.id, keyId));

  res.json({ keyId, status: 'revoked' });
});