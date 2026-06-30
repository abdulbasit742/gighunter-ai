// ClickUp bridge. Push high-scoring gigs into a ClickUp list as tasks so your
// freelancing pipeline lives where you already work. Optional, off by default.
// Enable by setting CLICKUP_API_TOKEN + CLICKUP_LIST_ID in .env.
import { logger } from './logger.js';

const API = 'https://api.clickup.com/api/v2';

function enabled() {
  return !!(process.env.CLICKUP_API_TOKEN && process.env.CLICKUP_LIST_ID);
}

// Map a gig's verdict/score to a ClickUp priority (1=urgent .. 4=low).
function priorityFor(gig) {
  if (gig.verdict === 'avoid') return 4;
  if (gig.score >= 85) return 1;
  if (gig.score >= 70) return 2;
  if (gig.score >= 50) return 3;
  return 4;
}

function describe(gig) {
  const lines = [
    `**Score:** ${gig.score}  ·  **Source:** ${gig.source}`,
    gig.payNote ? `**Pay:** ${gig.payNote}` : null,
    gig.verdict && gig.verdict !== 'clean' ? `**Risk:** ${gig.verdict} (${(gig.redFlags||[]).join(', ')})` : null,
    '',
    (gig.description || '').slice(0, 600),
    '',
    gig.url ? `[Open original gig](${gig.url})` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

// Create one task. Returns the created task or null on failure.
export async function pushGig(gig) {
  if (!enabled()) return null;
  try {
    const res = await fetch(`${API}/list/${process.env.CLICKUP_LIST_ID}/task`, {
      method: 'POST',
      headers: { 'Authorization': process.env.CLICKUP_API_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `[${gig.score}] ${gig.title}`.slice(0, 250),
        markdown_description: describe(gig),
        priority: priorityFor(gig),
        tags: ['gighunter', gig.source].filter(Boolean),
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
  } catch (e) {
    logger.warn(`clickup pushGig failed: ${e.message}`);
    return null;
  }
}

// Push the best NEW gigs. Returns count pushed.
export async function pushTopGigs(gigs, { minScore = 70, limit = 10 } = {}) {
  if (!enabled()) { logger.info('clickup: disabled (set CLICKUP_API_TOKEN + CLICKUP_LIST_ID to enable)'); return 0; }
  const picks = gigs.filter((g) => g.score >= minScore && g.verdict !== 'avoid').slice(0, limit);
  let pushed = 0;
  for (const g of picks) { if (await pushGig(g)) pushed++; }
  logger.info(`clickup: pushed ${pushed}/${picks.length} gigs to list ${process.env.CLICKUP_LIST_ID}`);
  return pushed;
}

export { enabled as clickupEnabled };
