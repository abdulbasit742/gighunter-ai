import express from 'express';
import healthRoutes from './routes/healthRoutes.js';
import gigsRoutes from './routes/gigsRoutes.js';
import proposalsRoutes from './routes/proposalsRoutes.js';
import { logger } from './lib/logger.js';

const app = express();
app.use(express.json());

app.use(healthRoutes);
app.use(gigsRoutes);
app.use(proposalsRoutes);

app.get('/', (_req, res) => res.json({
  service: 'GigHunter AI',
  endpoints: ['/health', 'POST /hunt', '/gigs', '/gigs/:id', 'POST /gigs/:id/proposal', '/proposals/:id'],
}));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info(`GigHunter AI listening on http://localhost:${PORT}`));
}

export default app;
