import { Router } from 'express';
import { db } from '../../db/index.js';
import { clients, clientUsers, wallets } from '../../db/schema.js';
import { hashPassword } from '../../services/auth.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';
import { AppError } from '../../middleware/error.js';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

export const adminClientsRouter = Router();

adminClientsRouter.post('/', authenticateAdmin, async (req, res) => {
  const { name, companyName, email, phone, gstin, address, contactName } = req.body;

  if (!name || !email) {
    throw new AppError(400, 'MISSING_FIELDS', 'name and email are required');
  }

  // Temporary password for the first client user — they'll reset it later
  // (password reset flow comes in a future step)
  const tempPassword = crypto.randomBytes(9).toString('base64');
  const passwordHash = await hashPassword(tempPassword);

  const result = await db.transaction(async (tx) => {
    const [clientInsert] = await tx.insert(clients).values({
      name,
      companyName,
      email,
      phone,
      gstin,
      address,
    });
    const clientId = clientInsert.insertId;

    await tx.insert(clientUsers).values({
      clientId,
      name: contactName ?? name,
      email,
      passwordHash,
    });

    await tx.insert(wallets).values({
      clientId,
      kind: 'recharge',
    });

    return clientId;
  });

  res.status(201).json({
    clientId: result,
    tempPassword, // shown once — client should reset on first login
  });
});

adminClientsRouter.get('/', authenticateAdmin, async (req, res) => {
  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
      companyName: clients.companyName,
      email: clients.email,
      kycStatus: clients.kycStatus,
      status: clients.status,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .orderBy(clients.id);

  res.json({ clients: clientList });
});

adminClientsRouter.get('/:id', authenticateAdmin, async (req, res) => {
  const clientId = Number(req.params.id);

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');

  res.json({ client });
});