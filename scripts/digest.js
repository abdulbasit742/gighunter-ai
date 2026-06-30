// CLI: `npm run digest` — print + (optionally) push the best new gigs to a webhook.
import { sendDigest } from '../src/lib/digest.js';
await sendDigest({ minScore: Number(process.env.MIN_SCORE_TO_DRAFT || 65) });
