import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRoutes from './routes/healthRoutes.js';
import gigsRoutes from './routes/gigsRoutes.js';
import proposalsRoutes from './routes/proposalsRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { startDailyJob } from './lib/scheduler.js';
import { runHunt } from '../scripts/huntCore.js';
import { logger } from './lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.use('/app', express.static(path.join(__dirname, '..', 'public')));
app.use(healthRoutes);
app.use(gigsRoutes);
app.use(proposalsRoutes);
app.use(platformRoutes);
app.use(statsRoutes);

app.get('/', (_req, res) => res.json({
  service: 'GigHunter AI',
  dashboard: '/app',
  endpoints: ['/health', 'POST /hunt', '/gigs', '/gigs/:id', 'POST /gigs/:id/status', 'POST /gigs/:id/proposal', '/proposals/:id', '/api/platforms', '/api/doctor', '/api/stats'],
}));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => logger.info(`GigHunter AI on http://localhost:${PORT}  (dashboard: /app)`));

  if (String(process.env.SCHEDULE_HUNT || 'false') === 'true') {
    const hour = Number(process.env.SCHEDULE_HOUR || 6);
    const minute = Number(process.env.SCHEDULE_MINUTE || 0);
    startDailyJob({
      hour, minute, name: 'daily-hunt',
      job: async () => {
        logger.info('scheduler: running daily hunt');
        const r = await runHunt();
        logger.info(`scheduler: hunt done, ${r.newGigs} new, digest count ${r.digest?.count ?? 0}`);
      },
    });
  }
}

export default app;
