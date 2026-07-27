import 'dotenv/config';
import { db, pool } from './index.js';
import { adminUsers } from './schema.js';
import { hashPassword } from '../services/auth.js';

async function seedAdmin() {
  const email = process.argv[2];
  const plainPassword = process.argv[3];
  const name = process.argv[4] ?? 'Admin';

  if (!email || !plainPassword) {
    console.error('Usage: tsx src/db/seed-admin.ts <email> <password> [name]');
    process.exit(1);
  }

  const passwordHash = await hashPassword(plainPassword);

  await db.insert(adminUsers).values({
    email,
    passwordHash,
    name,
    role: 'super_admin',
  });

  console.log(`Admin created: ${email}`);
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});