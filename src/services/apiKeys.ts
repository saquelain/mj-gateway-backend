import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';

export async function generateApiKey(clientId: number, label?: string) {
  const raw = 'rk_live_' + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
  const keyPrefix = raw.slice(0, 12);

  const [inserted] = await db.insert(apiKeys).values({ clientId, keyHash, keyPrefix, label });

  return { id: inserted.insertId, rawKey: raw }; // rawKey shown ONCE, never recoverable
}

export async function identifyClient(incomingKey?: string) {
  if (!incomingKey) return null;

  const keyHash = crypto.createHash('sha256').update(incomingKey).digest('hex');
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.keyPrefix, incomingKey.slice(0, 12)),
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.status, 'active'),
    ))
    .limit(1);

  return row ?? null;
}