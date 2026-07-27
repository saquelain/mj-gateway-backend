import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { verifyAdminToken } from '../services/auth.js';
import { AppError } from './error.js';

export interface AuthenticatedAdminRequest extends Request {
  admin: { id: number; role: string };
}

export async function authenticateAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }

  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, payload.uid))
    .limit(1);

  if (!admin || admin.status !== 'active') {
    throw new AppError(401, 'UNAUTHORIZED', 'Admin account is not active');
  }

  (req as AuthenticatedAdminRequest).admin = { id: admin.id, role: admin.role };
  next();
}