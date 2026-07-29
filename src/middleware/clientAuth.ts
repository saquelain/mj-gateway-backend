import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clientUsers, clients } from '../db/schema.js';
import { verifyClientToken } from '../services/auth.js';
import { AppError } from './error.js';

export interface AuthenticatedClientRequest extends Request {
  clientUser: { id: number; clientId: number };
}

export async function authenticateClient(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyClientToken(token);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }

  const [user] = await db.select().from(clientUsers).where(eq(clientUsers.id, payload.uid)).limit(1);
  if (!user || user.status !== 'active') {
    throw new AppError(401, 'UNAUTHORIZED', 'User account is not active');
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, payload.cid)).limit(1);
  if (!client || client.status !== 'active') {
    throw new AppError(403, 'CLIENT_SUSPENDED', 'Client account is not active');
  }

  (req as AuthenticatedClientRequest).clientUser = { id: user.id, clientId: user.clientId };
  next();
}