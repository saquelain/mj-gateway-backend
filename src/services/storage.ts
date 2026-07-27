import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

export interface SavedFile {
  filePath: string;   // relative path, stored in DB
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  subfolder: string
): Promise<SavedFile> {
  const ext = path.extname(originalName);
  const safeName = crypto.randomBytes(16).toString('hex') + ext;
  const relativePath = path.join(subfolder, safeName);
  const fullPath = path.join(UPLOAD_ROOT, relativePath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);

  return {
    filePath: relativePath,
    fileName: originalName,
    fileSize: buffer.length,
    mimeType,
  };
}

export async function readFile(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_ROOT, relativePath);
  return fs.readFile(fullPath);
}