import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';

export async function generateApiKey(clientId: number, label?: string, mode: 'test' | 'live' = 'live') {
    const prefix = mode === 'test' ? 'rk_test_' : 'rk_live_';
    const raw = prefix + crypto.randomBytes(24).toString('hex');
    const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
    const keyPrefix = raw.slice(0, 12);
  
    const [inserted] = await db.insert(apiKeys).values({ clientId, keyHash, keyPrefix, label, mode });
  
    return { id: inserted.insertId, rawKey: raw };
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

  return row ?? null; // row already includes `mode` since we select the full row
}