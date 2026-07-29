import { Router } from 'express';
import multer from 'multer';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clientDocuments, documentTypes } from '../../db/schema.js';
import { saveFile } from '../../services/storage.js';
import { authenticateClient, type AuthenticatedClientRequest } from '../../middleware/clientAuth.js';
import { AppError } from '../../middleware/error.js';

export const clientDocumentsRouter = Router();

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only PDF, JPEG, PNG allowed'));
    }
    cb(null, true);
  },
});

clientDocumentsRouter.get('/documents', authenticateClient, async (req, res) => {
  const { clientId } = (req as AuthenticatedClientRequest).clientUser;

  const docs = await db
    .select({
      id: clientDocuments.id,
      docTypeCode: documentTypes.code,
      docTypeName: documentTypes.name,
      fileName: clientDocuments.fileName,
      docNumber: clientDocuments.docNumber,
      status: clientDocuments.status,
      remarks: clientDocuments.remarks,
      createdAt: clientDocuments.createdAt,
    })
    .from(clientDocuments)
    .innerJoin(documentTypes, eq(clientDocuments.docTypeId, documentTypes.id))
    .where(eq(clientDocuments.clientId, clientId))
    .orderBy(clientDocuments.id);

  res.json({ documents: docs });
});

clientDocumentsRouter.get('/document-types', authenticateClient, async (_req, res) => {
  const types = await db
    .select()
    .from(documentTypes)
    .where(eq(documentTypes.status, 'active'));

  res.json({ documentTypes: types });
});

clientDocumentsRouter.post(
  '/documents',
  authenticateClient,
  upload.single('file'),
  async (req, res) => {
    const { clientId, id: userId } = (req as AuthenticatedClientRequest).clientUser;
    const { docTypeCode, docNumber } = req.body;

    if (!req.file) throw new AppError(400, 'MISSING_FILE', 'File is required');
    if (!docTypeCode) throw new AppError(400, 'MISSING_DOC_TYPE', 'docTypeCode is required');

    const [docType] = await db
      .select()
      .from(documentTypes)
      .where(and(eq(documentTypes.code, docTypeCode), eq(documentTypes.status, 'active')))
      .limit(1);
    if (!docType) throw new AppError(400, 'INVALID_DOC_TYPE', 'Unknown document type');

    const saved = await saveFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `kyc/client_${clientId}`
    );

    const [inserted] = await db.insert(clientDocuments).values({
      clientId,
      docTypeId: docType.id,
      filePath: saved.filePath,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
      docNumber,
      uploadedByType: 'client',
      uploadedById: userId,
    });

    res.status(201).json({ documentId: inserted.insertId, status: 'pending' });
  }
);