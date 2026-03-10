import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as Record<string, unknown>).id as string | undefined;

  if (err instanceof AppError) {
    logger.warn({ err, requestId }, `AppError: ${err.message}`);
    res.status(err.statusCode).json({
      error: err.code ?? err.name,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ err, requestId }, 'Validation error');
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.errors,
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(requestId ? { requestId } : {}),
  });
}
