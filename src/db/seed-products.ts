import 'dotenv/config';
import { db, pool } from './index.js';
import { providers, apiProducts } from './schema.js';

async function seed() {
  const [providerInsert] = await db.insert(providers).values({
    code: 'surepass',
    name: 'SurePass',
    baseUrl: 'https://kyc-api.surepass.io',
  });
  const providerId = providerInsert.insertId;

  const [productInsert] = await db.insert(apiProducts).values({
    code: 'pan_verify',
    name: 'PAN Verification',
    description: 'Verify PAN card details',
    providerId,
    defaultPrice: '5.00',
    ourCost: '2.00',
  });

  console.log('Provider ID:', providerId);
  console.log('Product ID:', productInsert.insertId);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});