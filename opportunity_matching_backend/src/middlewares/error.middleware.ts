// src\middlewares\error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err, 'Unhandled error');
  if (err?.name === 'ZodError') {
    return res.status(400).json({ message: 'Validation error', issues: err.errors });
  }
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal Server Error' });
}