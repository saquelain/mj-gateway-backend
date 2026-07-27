import 'dotenv/config';
import { db, pool } from './index.js';
import { documentTypes } from './schema.js';

const DEFAULT_TYPES = [
  { code: 'pan_card', name: 'PAN Card', isMandatory: true },
  { code: 'gst_cert', name: 'GST Certificate', isMandatory: false },
  { code: 'address_proof', name: 'Address Proof', isMandatory: true },
  { code: 'cancelled_cheque', name: 'Cancelled Cheque', isMandatory: true },
  { code: 'agreement', name: 'Signed Agreement', isMandatory: true },
];

async function seed() {
  for (const doc of DEFAULT_TYPES) {
    await db.insert(documentTypes).values(doc).onDuplicateKeyUpdate({
      set: { name: doc.name, isMandatory: doc.isMandatory },
    });
  }
  console.log('Document types seeded');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});