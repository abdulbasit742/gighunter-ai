// API for the dashboard: list platforms, toggle which are enabled, run live doctor.
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLATFORMS } from '../lib/platforms.js';
import { fetchSource } from '../lib/sources.js';
import { loadProfile } from '../lib/profile.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG = path.join(__dirname, '..', '..', 'config', 'profile.json');
const router = Router();

router.get('/api/platforms', (_req, res) => {
  let enabled = [];
  try { enabled = loadProfile().platforms || []; } catch { /* noop */ }
  res.json({
    platforms: PLATFORMS.map((p) => ({ key: p.key, name: p.name, mode: p.mode, notes: p.notes })),
    enabled,
  });
});

router.post('/api/platforms', (req, res) => {
  const keys = Array.isArray(req.body?.platforms) ? req.body.platforms : [];
  let profile = {};
  try { profile = JSON.parse(fs.readFileSync(CFG, 'utf8')); } catch { /* start fresh */ }
  profile.platforms = keys;
  fs.writeFileSync(CFG, JSON.stringify(profile, null, 2));
  res.json({ ok: true, platforms: keys });
});

router.get('/api/doctor', async (_req, res) => {
  const results = [];
  for (const p of PLATFORMS) {
    if (p.mode === 'manual') { results.push({ name: p.name, status: 'manual' }); continue; }
    if (p.mode === 'api' && p.envKey && !process.env[p.envKey]) { results.push({ name: p.name, status: 'needs-key' }); continue; }
    try {
      const gigs = await fetchSource({ name: p.name, type: p.type, url: p.url });
      results.push({ name: p.name, status: gigs.length ? `ok(${gigs.length})` : 'empty' });
    } catch (e) {
      results.push({ name: p.name, status: 'fail' });
    }
  }
  res.json({ results });
});

export default router;
