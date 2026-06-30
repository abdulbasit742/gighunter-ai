import { Router } from 'express';
import { dueFollowups, followupText, markFollowupSent } from '../lib/followups.js';
import { store } from '../lib/store.js';

const router = Router();

// List gigs that need a follow-up, with a ready-to-send draft.
router.get('/api/followups', (_req, res) => {
  const due = dueFollowups().map(({ gig, nudge, ageDays }) => ({
    id: gig.id, title: gig.title, score: gig.score, source: gig.source,
    nudge, ageDays, url: gig.url, message: followupText(gig, nudge),
  }));
  res.json({ due, count: due.length });
});

// Mark a follow-up as sent (you sent it; we advance the counter).
router.post('/gigs/:id/followup', (req, res) => {
  const g = markFollowupSent(req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true, followupsSent: g.followupsSent });
});

export default router;
