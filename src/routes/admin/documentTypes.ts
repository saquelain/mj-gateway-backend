import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { documentTypes } from '../../db/schema.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';
import { AppError } from '../../middleware/error.js';

export const adminDocumentTypesRouter = Router();

adminDocumentTypesRouter.get('/', authenticateAdmin, async (_req, res) => {
  const types = await db.select().from(documentTypes).orderBy(documentTypes.id);
  res.json({ documentTypes: types });
});

adminDocumentTypesRouter.post('/', authenticateAdmin, async (req, res) => {
  const { code, name, isMandatory } = req.body;

  if (!code || !name) {
    throw new AppError(400, 'MISSING_FIELDS', 'code and name are required');
  }

  const [inserted] = await db.insert(documentTypes).values({
    code,
    name,
    isMandatory: !!isMandatory,
  });

  res.status(201).json({ id: inserted.insertId, code, name, isMandatory: !!isMandatory });
});

adminDocumentTypesRouter.patch('/:id', authenticateAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, isMandatory, status } = req.body;

  const [existing] = await db.select().from(documentTypes).where(eq(documentTypes.id, id)).limit(1);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Document type not found');

  await db.update(documentTypes)
    .set({
      ...(name !== undefined && { name }),
      ...(isMandatory !== undefined && { isMandatory }),
      ...(status !== undefined && { status }),
    })
    .where(eq(documentTypes.id, id));

  res.json({ id, updated: true });
});