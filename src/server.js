import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRoutes from './routes/healthRoutes.js';
import gigsRoutes from './routes/gigsRoutes.js';
import proposalsRoutes from './routes/proposalsRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import followupRoutes from './routes/followupRoutes.js';
import { startDailyJob } from './lib/scheduler.js';
import { runHunt } from '../scripts/huntCore.js';
import { logger } from './lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const configuredToken = String(process.env.GIGHUNTER_API_TOKEN || '').trim();
let huntRunning = false;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
});
app.use(express.json({ limit: '256kb', strict: true }));

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

app.use((req, res, next) => {
  if (!configuredToken || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const supplied = req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!safeEqual(supplied, configuredToken)) return res.status(401).json({ error: 'unauthorized' });
  next();
});

app.use((req, res, next) => {
  if (req.method !== 'POST' || req.path !== '/hunt') return next();
  if (huntRunning) return res.status(409).json({ error: 'hunt already running' });
  huntRunning = true;
  res.on('finish', () => { huntRunning = false; });
  res.on('close', () => { huntRunning = false; });
  next();
});

app.use('/app', express.static(path.join(__dirname, '..', 'public'), {
  index: 'index.html',
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
}));
app.use(healthRoutes);
app.use(gigsRoutes);
app.use(proposalsRoutes);
app.use(platformRoutes);
app.use(statsRoutes);
app.use(followupRoutes);

app.get('/', (_req, res) => res.json({
  service: 'GigHunter AI',
  dashboard: '/app',
  safety: 'draft-only; never auto-applies',
  endpoints: ['/health', 'POST /hunt', '/gigs', '/gigs/:id', 'POST /gigs/:id/status', 'POST /gigs/:id/proposal', '/proposals/:id', '/api/platforms', '/api/doctor', '/api/stats', '/api/followups'],
}));

app.use((err, _req, res, _next) => {
  logger.error('request failed', err?.message || 'unknown error');
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'request too large' });
  if (err instanceof SyntaxError) return res.status(400).json({ error: 'invalid JSON' });
  return res.status(500).json({ error: 'internal error' });
});

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
if (process.env.NODE_ENV !== 'test') {
  const publicBind = !['127.0.0.1', 'localhost', '::1'].includes(HOST);
  if (publicBind && !configuredToken) {
    throw new Error('GIGHUNTER_API_TOKEN is required when HOST is publicly reachable');
  }

  app.listen(PORT, HOST, () => logger.info(`GigHunter AI on http://${HOST}:${PORT}  (dashboard: /app)`));
  if (String(process.env.SCHEDULE_HUNT || 'false') === 'true') {
    const hour = Number(process.env.SCHEDULE_HOUR || 6);
    const minute = Number(process.env.SCHEDULE_MINUTE || 0);
    startDailyJob({
      hour, minute, name: 'daily-hunt',
      job: async () => { const r = await runHunt(); logger.info(`scheduler: hunt done, ${r.newGigs} new`); },
    });
  }
}

export default app;
