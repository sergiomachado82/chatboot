import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

/** Sets Cache-Control header with the specified max-age (seconds). */
export function cacheControl(maxAge: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
}

/** Intercepts res.json() to compute an ETag and return 304 if it matches If-None-Match. */
export function withETag() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      const raw = JSON.stringify(body);
      const etag = `"${createHash('md5').update(raw).digest('hex')}"`;

      res.set('ETag', etag);

      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return res;
      }

      return originalJson(body);
    };

    next();
  };
}
