import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';

import { env } from './config/env';
import { connectDB } from './config/database';
import { logger } from './config/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import { authRouter } from './routes/api/v1/auth';
import { bookingsRouter } from './routes/api/v1/bookings';
import { driversRouter } from './routes/api/v1/drivers';
import { customersRouter } from './routes/api/v1/customers';
import { adminRouter } from './routes/api/v1/admin';
import { healthRouter } from './routes/api/v1/health';
import { uploadRouter } from './routes/api/v1/upload';
import { setupSocketIO } from './socket';

async function bootstrap() {
  // ─── Connect to MongoDB ──────────────────────────────────────────────────────
  await connectDB();

  // ─── Express App ─────────────────────────────────────────────────────────────
  const app = express();
  const server = http.createServer(app);

  // ─── Security Middleware ──────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // needed for map tiles
  }));

  // CORS - locked to known frontend origins
  const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
  }));

  // NoSQL injection prevention - strips keys starting with $ or containing .
  app.use(mongoSanitize());

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request ID + structured logging
  app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).requestId = (req.headers['x-request-id'] as string) || uuidv4();
    next();
  });

  app.use(pinoHttp({
    logger,
    customProps: (req) => ({ requestId: (req as any).requestId }),
    autoLogging: { ignore: (req) => req.url === '/healthz' },
  }));

  // ─── Rate Limiting ────────────────────────────────────────────────────────────
  app.use('/api/', apiLimiter);

  // ─── Routes ──────────────────────────────────────────────────────────────────
  app.use('/healthz', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/bookings', bookingsRouter);
  app.use('/api/v1/drivers', driversRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/upload', uploadRouter);

  // ─── Socket.io ────────────────────────────────────────────────────────────────
  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const socketService = setupSocketIO(io);

  // Make socketService available to route handlers via app.locals
  app.locals.socketService = socketService;

  // ─── 404 + Error Handlers ─────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ─── Start Server ─────────────────────────────────────────────────────────────
  server.listen(env.PORT, () => {
    logger.info(`🚀 DriverConnect API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🔌 Socket.io ready`);
    logger.info(`💚 Health: http://localhost:${env.PORT}/healthz`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
