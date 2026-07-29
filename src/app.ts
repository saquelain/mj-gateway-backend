import express from 'express';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { adminAuthRouter } from './routes/admin/auth.js';
import { adminClientsRouter } from './routes/admin/clients.js';
import { adminDocumentsRouter } from './routes/admin/documents.js';
import { adminTopupsRouter } from './routes/admin/topups.js';
import { adminWalletRouter } from './routes/admin/wallet.js';
import { adminAccessRouter } from './routes/admin/access.js';
import { adminKeysRouter } from './routes/admin/keys.js';
import { panVerifyRouter } from './routes/api/panVerify.js';
import { adminUsageRouter } from './routes/admin/usage.js';
import { adminDocumentTypesRouter } from './routes/admin/documentTypes.js';
import { adminStatsRouter } from './routes/admin/stats.js';
import { clientAuthRouter } from './routes/client/auth.js';
import { clientWalletRouter } from './routes/client/wallet.js';
import { clientTopupsRouter } from './routes/client/topups.js';
import { clientDocumentsRouter } from './routes/client/documents.js';
import { clientKeysRouter } from './routes/client/keys.js';

import cors from 'cors';

export const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/admin/auth', adminAuthRouter);
app.use('/admin/clients', adminClientsRouter);
app.use('/admin/clients', adminDocumentsRouter);
app.use('/admin/clients', adminWalletRouter);
app.use('/admin/clients', adminAccessRouter);
app.use('/admin/clients', adminKeysRouter);
app.use('/admin/clients', adminUsageRouter);
app.use('/api/v1', panVerifyRouter);
app.use('/admin/topups', adminTopupsRouter);
app.use('/admin/document-types', adminDocumentTypesRouter);
app.use('/admin/stats', adminStatsRouter);

app.use('/client/auth', clientAuthRouter);
app.use('/client/me', clientWalletRouter);
app.use('/client/me', clientTopupsRouter);
app.use('/client/me', clientDocumentsRouter);
app.use('/client/me', clientKeysRouter);

app.use(notFoundHandler);
app.use(errorHandler);