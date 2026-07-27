import { Router } from 'express';
import multer from 'multer';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { clientDocuments, documentTypes, clients } from '../../db/schema.js';
import { saveFile } from '../../services/storage.js';
import { authenticateAdmin, type AuthenticatedAdminRequest } from '../../middleware/adminAuth.js';
import { AppError } from '../../middleware/error.js';

export const adminDocumentsRouter = Router();

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

adminDocumentsRouter.post(
  '/:clientId/documents',
  authenticateAdmin,
  upload.single('file'),
  async (req, res) => {
    const clientId = Number(req.params.clientId);
    const { docTypeCode, docNumber } = req.body;
    const adminId = (req as AuthenticatedAdminRequest).admin.id;

    if (!req.file) {
      throw new AppError(400, 'MISSING_FILE', 'File is required');
    }
    if (!docTypeCode) {
      throw new AppError(400, 'MISSING_DOC_TYPE', 'docTypeCode is required');
    }

    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!client) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');

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
      uploadedByType: 'admin',
      uploadedById: adminId,
    });

    res.status(201).json({ documentId: inserted.insertId, status: 'pending' });
  }
);

adminDocumentsRouter.patch(
    '/:clientId/documents/:docId/review',
    authenticateAdmin,
    async (req, res) => {
      const clientId = Number(req.params.clientId);
      const docId = Number(req.params.docId);
      const { decision, remarks } = req.body; // decision: 'verified' | 'rejected'
      const adminId = (req as AuthenticatedAdminRequest).admin.id;
  
      if (!['verified', 'rejected'].includes(decision)) {
        throw new AppError(400, 'INVALID_DECISION', 'decision must be verified or rejected');
      }
  
      await db.transaction(async (tx) => {
        const [doc] = await tx
          .select()
          .from(clientDocuments)
          .where(and(eq(clientDocuments.id, docId), eq(clientDocuments.clientId, clientId)))
          .limit(1);
  
        if (!doc) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  
        await tx.update(clientDocuments)
          .set({ status: decision, remarks, reviewedBy: adminId, reviewedAt: new Date() })
          .where(eq(clientDocuments.id, docId));
  
        if (decision === 'verified') {
          // Check if ALL mandatory doc types now have a verified doc for this client
          const mandatoryTypes = await tx
            .select({ id: documentTypes.id })
            .from(documentTypes)
            .where(and(eq(documentTypes.isMandatory, true), eq(documentTypes.status, 'active')));
  
          const verifiedDocs = await tx
            .select({ docTypeId: clientDocuments.docTypeId })
            .from(clientDocuments)
            .where(and(eq(clientDocuments.clientId, clientId), eq(clientDocuments.status, 'verified')));
  
          const verifiedTypeIds = new Set(verifiedDocs.map((d) => d.docTypeId));
          const allMandatoryVerified = mandatoryTypes.every((t) => verifiedTypeIds.has(t.id));
  
          if (allMandatoryVerified) {
            await tx.update(clients)
              .set({ kycStatus: 'verified', kycVerifiedAt: new Date(), kycVerifiedBy: adminId })
              .where(eq(clients.id, clientId));
          }
        }
      });
  
      res.json({ documentId: docId, status: decision });
    }
  );