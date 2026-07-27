import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { adminUsers } from '../../db/schema.js';
import { verifyPassword, signAdminToken } from '../../services/auth.js';
import { AppError } from '../../middleware/error.js';

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, 'MISSING_FIELDS', 'Email and password are required');
  }

  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (!admin || admin.status !== 'active') {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);
  if (!validPassword) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = signAdminToken({ uid: admin.id, role: admin.role });

  res.json({
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});