import { Router, Request, Response } from 'express';
import { logger } from '../../../config/logger';
import mongoose from 'mongoose';

const router = Router();

// ─── Health Check ─────────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
  const isHealthy = mongoState === 1;

  const status = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongo: mongoStatus,
    },
    version: '1.0.0',
  };

  res.status(isHealthy ? 200 : 503).json(status);
});

export { router as healthRouter };
