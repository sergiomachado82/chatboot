import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Token required' });
    return;
  }

  const token = header.slice(7);
  const result = verifyToken(token);
  if (!result.valid) {
    const message = result.reason === 'expired' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: 'Unauthorized', message });
    return;
  }

  req.user = result.payload;
  next();
}
