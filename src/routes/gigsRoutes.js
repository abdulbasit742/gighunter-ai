import { Router } from 'express';
import { runHunt } from '../../scripts/huntCore.js';
import { store, VALID_STATUS } from '../lib/store.js';
import { draftProposal } from '../lib/proposal.js';
import { loadProfile } from '../lib/profile.js';

const router = Router();

router.post('/hunt', async (_req, res) => {
  try { res.json(await runHunt()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/gigs', (req, res) => {
  const status = req.query.status || null;
  res.json({ gigs: store.listGigs({ status }), newCount: store.newCount() });
});

router.get('/gigs/:id', (req, res) => {
  const gig = store.getGig(req.params.id);
  if (!gig) return res.status(404).json({ error: 'not found' });
  res.json({ ...gig, proposal: store.getProposal(gig.id) });
});

router.post('/gigs/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: `status must be one of ${VALID_STATUS.join(', ')}` });
  const gig = store.setStatus(req.params.id, status);
  if (!gig) return res.status(404).json({ error: 'not found' });
  res.json(gig);
});

router.post('/gigs/:id/proposal', async (req, res) => {
  const gig = store.getGig(req.params.id);
  if (!gig) return res.status(404).json({ error: 'not found' });
  try {
    const proposal = await draftProposal(gig, loadProfile());
    store.saveProposal(proposal);
    res.json(proposal);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
