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

/**
 * Verifies user credentials against the database.
 * @param email - The user's email address
 * @param password - The plaintext password to verify
 * @returns The agent data if credentials are valid, or null if invalid
 */
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

/**
 * Generates a signed JWT token from the given payload.
 * @param payload - The token payload containing user id, email, and role
 * @returns The signed JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
}

type VerifyResult =
  | {
      valid: true;
      payload: TokenPayload;
    }
  | {
      valid: false;
      reason: 'expired' | 'invalid';
    };

/**
 * Verifies and decodes a JWT token.
 * @param token - The JWT token string to verify
 * @returns An object indicating validity with the decoded payload, or the failure reason
 */
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

/**
 * Generates a password reset token for the given email and stores it in the database with a 1-hour expiry.
 * @param email - The email address of the agent requesting the reset
 * @returns The generated reset token string, or null if the agent is not found or inactive
 */
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

/**
 * Resets an agent's password using a valid, non-expired reset token.
 * @param token - The reset token previously generated via generateResetToken
 * @param newPassword - The new plaintext password to set
 * @returns True if the password was successfully reset, false if the token is invalid or expired
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const agente = await prisma.agente.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!agente) return false;

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.agente.update({
    where: { id: agente.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return true;
}
