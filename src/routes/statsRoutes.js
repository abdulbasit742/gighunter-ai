import { Router } from 'express';
import { computeStats } from '../lib/analytics.js';
import { loadProfile } from '../lib/profile.js';

const router = Router();

router.get('/api/stats', (_req, res) => {
  let profile = null;
  try { profile = loadProfile(); } catch { /* stats still work without profile */ }
  res.json(computeStats(profile));
});

export default router;
