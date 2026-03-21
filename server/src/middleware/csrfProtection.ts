import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Path prefixes exempt from CSRF validation (public/webhook endpoints) */
const EXEMPT_PREFIXES = [
  '/api/health',
  '/api/auth',
  '/api/webhook',
  '/api/simulator',
  '/api/webchat',
  '/api/contact',
  '/api/ical',
  '/api/internal-email',
];

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Always ensure the CSRF cookie exists
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // frontend needs to read it
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  // Safe methods don't need validation
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Exempt paths
  const path = req.path;
  if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    next();
    return;
  }

  // Validate double-submit cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'Forbidden', message: 'Invalid or missing CSRF token' });
    return;
  }

  next();
}
