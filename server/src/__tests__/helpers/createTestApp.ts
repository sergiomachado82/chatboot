import express from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { generateToken } from '../../services/authService.js';

export function createTestApp(...routers: express.Router[]) {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  for (const router of routers) {
    app.use('/api', router);
  }
  return app;
}

export function adminToken() {
  return 'Bearer ' + generateToken({ id: 'admin-1', email: 'admin@test.com', rol: 'admin' });
}

export function agenteToken() {
  return 'Bearer ' + generateToken({ id: 'agente-1', email: 'agente@test.com', rol: 'agente' });
}
