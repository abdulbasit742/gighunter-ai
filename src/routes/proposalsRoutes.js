import { Router } from 'express';
import { store } from '../lib/store.js';

const router = Router();

router.get('/proposals/:id', (req, res) => {
  const p = store.getProposal(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});

export default router;
