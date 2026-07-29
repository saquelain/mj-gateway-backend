import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '12h';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10); // cost factor 10, per doc's security flag
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface AdminJwtPayload {
  uid: number;
  role: string;
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
}

export interface ClientJwtPayload {
  uid: number;
  cid: number; // client id
}

export function signClientToken(payload: ClientJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyClientToken(token: string): ClientJwtPayload {
  return jwt.verify(token, JWT_SECRET) as ClientJwtPayload;
}