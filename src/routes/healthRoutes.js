import { Router } from 'express';
import { hubInfo } from '../lib/llmHub.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gighunter-ai', llm: hubInfo(), time: new Date().toISOString() });
});

export default router;
