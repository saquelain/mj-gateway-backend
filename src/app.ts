import express from 'express';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { adminAuthRouter } from './routes/admin/auth.js';
import { adminClientsRouter } from './routes/admin/clients.js';
import { adminDocumentsRouter } from './routes/admin/documents.js';
import { adminTopupsRouter } from './routes/admin/topups.js';
import { adminWalletRouter } from './routes/admin/wallet.js';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/admin/auth', adminAuthRouter);
app.use('/admin/clients', adminClientsRouter);
app.use('/admin/clients', adminDocumentsRouter);
app.use('/admin/clients', adminWalletRouter);
app.use('/admin/topups', adminTopupsRouter);

app.use(notFoundHandler);
app.use(errorHandler);