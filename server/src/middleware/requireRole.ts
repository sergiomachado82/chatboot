import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware that restricts access to users with specific roles.
 * Must be used after authMiddleware (req.user must be set).
 */
export function requireRole(...roles: Array<'admin' | 'agente'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
