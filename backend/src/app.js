import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import foodRoutes from './routes/food.routes.js';
import foodlogRoutes from './routes/foodlog.routes.js';
import statsRoutes from './routes/stats.routes.js';
import weightRoutes from './routes/weight.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.frontendOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/food', foodRoutes);
  app.use('/api/foodlog', foodlogRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/weight', weightRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint inconnu' });
  });

  if (env.nodeEnv === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }

  app.use(errorHandler);

  return app;
}
