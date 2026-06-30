import { Router } from 'express';
import { runHunt } from '../../scripts/huntCore.js';
import { store } from '../lib/store.js';
import { draftProposal } from '../lib/proposal.js';
import { loadProfile } from '../lib/profile.js';

const router = Router();

router.post('/hunt', async (_req, res) => {
  try {
    const result = await runHunt();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/gigs', (_req, res) => {
  res.json({ gigs: store.listGigs() });
});

router.get('/gigs/:id', (req, res) => {
  const gig = store.getGig(req.params.id);
  if (!gig) return res.status(404).json({ error: 'not found' });
  res.json(gig);
});

router.post('/gigs/:id/proposal', async (req, res) => {
  const gig = store.getGig(req.params.id);
  if (!gig) return res.status(404).json({ error: 'not found' });
  try {
    const profile = loadProfile();
    const proposal = await draftProposal(gig, profile);
    store.saveProposal(proposal);
    res.json(proposal);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
