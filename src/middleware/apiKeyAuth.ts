import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clients } from '../db/schema.js';
import { identifyClient } from '../services/apiKeys.js';
import { AppError } from './error.js';

export interface AuthenticatedApiRequest extends Request {
  apiClient: { id: number; kycStatus: string; status: string };
  apiKeyId: number;
}

export async function authenticateApiKey(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'MISSING_API_KEY', 'API key required');
  }

  const rawKey = authHeader.slice(7);
  const keyRow = await identifyClient(rawKey);
  if (!keyRow) {
    throw new AppError(401, 'INVALID_API_KEY', 'Invalid or revoked API key');
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, keyRow.clientId)).limit(1);
  if (!client) throw new AppError(401, 'INVALID_API_KEY', 'Client not found');

  (req as AuthenticatedApiRequest).apiClient = {
    id: client.id,
    kycStatus: client.kycStatus,
    status: client.status,
  };
  (req as AuthenticatedApiRequest).apiKeyId = keyRow.id;
  next();
}