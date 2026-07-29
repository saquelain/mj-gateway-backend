import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pool } from './index.js';
import { clientUsers } from './schema.js';
import { hashPassword } from '../services/auth.js';

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: tsx src/db/reset-client-password.ts <email> <newPassword>');
    process.exit(1);
  }

  const passwordHash = await hashPassword(newPassword);

  const result = await db
    .update(clientUsers)
    .set({ passwordHash })
    .where(eq(clientUsers.email, email));

  console.log(`Password reset for ${email}`);
  await pool.end();
}

resetPassword().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});