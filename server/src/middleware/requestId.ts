import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestId(req: Request, _res: Response, next: NextFunction): void {
  req.id = (req.headers['x-request-id'] as string) || randomUUID();
  next();
}
