import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { csrfProtection } from './middleware/csrfProtection.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
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
import emailsRouter from './routes/emails.js';
import icalRouter from './routes/ical.js';
import webchatRouter from './routes/webchat.js';
import contactRouter from './routes/contact.js';
import internalEmailRouter from './routes/internalEmail.js';
import dashboardRouter from './routes/dashboard.js';
import integrationLogsRouter from './routes/integrationLogs.js';

const app = express();

// Parse allowed origins from env
const allowedOrigins = env.ALLOWED_ORIGINS;
if (allowedOrigins === '*' && env.NODE_ENV === 'production') {
  logger.warn(
    'ALLOWED_ORIGINS is set to "*" in production — this allows any origin. Set explicit origins in .env for security.',
  );
}

// Global middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        fontSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: allowedOrigins === '*' ? true : allowedOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      // Store raw body for webhook signature verification
      (req as Record<string, unknown>).rawBody = buf;
    },
  }),
);
app.use(cookieParser());
app.use(csrfProtection);
app.use(requestId);
app.use(requestLogger);

// Public logo endpoint (needs to be accessible from login page)
app.get('/api/public/logo', async (_req, res) => {
  try {
    const { getBotConfig } = await import('./services/botConfigService.js');
    const config = await getBotConfig();
    res.json({ logo: config.logo ?? null });
  } catch {
    res.json({ logo: null });
  }
});

// Public routes
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', webhookRouter);
app.use('/api', simulatorRouter);
app.use('/api', icalRouter);
app.use('/api', webchatRouter);
app.use('/api', contactRouter);
app.use('/api', internalEmailRouter);

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
protectedRouter.use(emailsRouter);
protectedRouter.use(dashboardRouter);
protectedRouter.use(integrationLogsRouter);
app.use('/api', protectedRouter);

// In production, serve built frontend files (Vite output)
if (env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const staticPath = path.resolve(__dirname, '../../dist');

  app.use(express.static(staticPath));

  // SPA fallback: non-API GET requests serve index.html
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Error handler
app.use(errorHandler);

export default app;
