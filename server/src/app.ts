import express, { Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import webhookRouter from './routes/webhook.js';
import simulatorRouter from './routes/simulator.js';
import conversacionesRouter from './routes/conversaciones.js';
import inventarioRouter from './routes/inventario.js';
import reservasRouter from './routes/reservas.js';
import huespedesRouter from './routes/huespedes.js';
import agentesRouter from './routes/agentes.js';
import complejosRouter from './routes/complejos.js';
import whatsappProfileRouter from './routes/whatsappProfile.js';
import botConfigRouter from './routes/botConfig.js';
import icalRouter from './routes/ical.js';

const app = express();

// Parse allowed origins from env
const allowedOrigins = env.ALLOWED_ORIGINS;

// Global middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins === '*' ? true : allowedOrigins.split(',').map(o => o.trim()),
  credentials: true,
}));
app.use(express.json({
  verify: (req, _res, buf) => {
    // Store raw body for webhook signature verification
    (req as Record<string, unknown>).rawBody = buf;
  },
}));
app.use(requestId);
app.use(requestLogger);

// Public routes
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', webhookRouter);
app.use('/api', simulatorRouter);
app.use('/api', icalRouter);

// Protected routes - all behind auth + rate limit
const protectedRouter = Router();
protectedRouter.use(authMiddleware);
protectedRouter.use(rateLimiter);
protectedRouter.use(conversacionesRouter);
protectedRouter.use(inventarioRouter);
protectedRouter.use(reservasRouter);
protectedRouter.use(huespedesRouter);
protectedRouter.use(agentesRouter);
protectedRouter.use(complejosRouter);
protectedRouter.use(whatsappProfileRouter);
protectedRouter.use(botConfigRouter);
app.use('/api', protectedRouter);

// Error handler
app.use(errorHandler);

export default app;
