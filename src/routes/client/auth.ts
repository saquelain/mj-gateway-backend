import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clientUsers } from '../../db/schema.js';
import { verifyPassword, signClientToken } from '../../services/auth.js';
import { AppError } from '../../middleware/error.js';

export const clientAuthRouter = Router();

clientAuthRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'MISSING_FIELDS', 'Email and password are required');
  }

  const [user] = await db
    .select()
    .from(clientUsers)
    .where(eq(clientUsers.email, email))
    .limit(1);

  if (!user || user.status !== 'active') {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = signClientToken({ uid: user.id, cid: user.clientId });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, clientId: user.clientId },
  });
});