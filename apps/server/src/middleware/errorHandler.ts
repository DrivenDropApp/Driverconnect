import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  logger.error({
    err,
    requestId,
    method: req.method,
    url: req.url,
    body: req.body,
  }, 'Unhandled error');

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      error: 'duplicate_key',
      message: 'A record with this value already exists',
      requestId,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'validation_error',
      message: err.message,
      requestId,
    });
    return;
  }

  res.status(500).json({
    error: 'internal_server_error',
    message: 'Something went wrong. Please try again.',
    requestId,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.url} not found`,
  });
}
