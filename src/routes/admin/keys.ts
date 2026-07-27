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
  const { label } = req.body;

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');

  const { id, rawKey } = await generateApiKey(clientId, label);

  res.status(201).json({
    keyId: id,
    apiKey: rawKey, // shown once — cannot be retrieved again
    warning: 'Save this key now. It will not be shown again.',
  });
});