import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

export async function verifyCredentials(email: string, password: string) {
  const agente = await prisma.agente.findUnique({ where: { email } });
  if (!agente || !agente.activo) return null;

  const valid = await bcrypt.compare(password, agente.passwordHash);
  if (!valid) return null;

  return {
    id: agente.id,
    nombre: agente.nombre,
    email: agente.email,
    rol: agente.rol,
    activo: agente.activo,
    online: agente.online,
    creadoEn: agente.creadoEn.toISOString(),
  };
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
}

type VerifyResult = {
  valid: true;
  payload: TokenPayload;
} | {
  valid: false;
  reason: 'expired' | 'invalid';
};

export function verifyToken(token: string): VerifyResult {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return { valid: true, payload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: false, reason: 'invalid' };
  }
}

export async function generateResetToken(email: string): Promise<string | null> {
  const agente = await prisma.agente.findUnique({ where: { email } });
  if (!agente || !agente.activo) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.agente.update({
    where: { email },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const agente = await prisma.agente.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!agente) return false;

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.agente.update({
    where: { id: agente.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return true;
}
