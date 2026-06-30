import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRoutes from './routes/healthRoutes.js';
import gigsRoutes from './routes/gigsRoutes.js';
import proposalsRoutes from './routes/proposalsRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import { logger } from './lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Web dashboard
app.use('/app', express.static(path.join(__dirname, '..', 'public')));

app.use(healthRoutes);
app.use(gigsRoutes);
app.use(proposalsRoutes);
app.use(platformRoutes);

app.get('/', (_req, res) => res.json({
  service: 'GigHunter AI',
  dashboard: '/app',
  endpoints: ['/health', 'POST /hunt', '/gigs', '/gigs/:id', 'POST /gigs/:id/proposal', '/proposals/:id', '/api/platforms', '/api/doctor'],
}));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info(`GigHunter AI on http://localhost:${PORT}  (dashboard: /app)`));
}

export default app;
