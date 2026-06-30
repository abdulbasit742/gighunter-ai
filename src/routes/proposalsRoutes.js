import { Router } from 'express';
import { store } from '../lib/store.js';
import { draftVariants, TONES } from '../lib/proposal.js';
import { loadProfile } from '../lib/profile.js';

const router = Router();

router.get('/proposals/:id', (req, res) => {
  const p = store.getProposal(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});

// List available tones for the UI.
router.get('/api/tones', (_req, res) => {
  res.json({ tones: Object.keys(TONES) });
});

// Generate 3 tone variants for a gig (does not overwrite the saved proposal).
router.post('/gigs/:id/variants', async (req, res) => {
  const gig = store.getGig(req.params.id);
  if (!gig) return res.status(404).json({ error: 'not found' });
  try {
    const tones = Array.isArray(req.body?.tones) ? req.body.tones : undefined;
    const out = await draftVariants(gig, loadProfile(), tones);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pick a variant and save it as THE proposal for the gig.
router.post('/gigs/:id/proposal/select', (req, res) => {
  const gig = store.getGig(req.params.id);
  if (!gig) return res.status(404).json({ error: 'not found' });
  const { body, tone } = req.body || {};
  if (!body) return res.status(400).json({ error: 'body required' });
  const saved = store.saveProposal({ gigId: gig.id, gigTitle: gig.title, tone: tone || 'custom', body, draftedAt: new Date().toISOString() });
  res.json(saved);
});

export default router;
