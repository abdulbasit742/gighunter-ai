// Build a digest of the best NEW gigs. Channels: console (always), and optional
// webhook. Auto-detects ClickUp vs Slack/Discord by URL and formats accordingly.
import { store } from './store.js';
import { logger } from './logger.js';

export function buildDigest({ limit = 10, minScore = 65 } = {}) {
  const gigs = store.listGigs({ status: 'new' }).filter((g) => (g.score ?? 0) >= minScore).slice(0, limit);
  const lines = gigs.map((g) => `• [${g.score}] ${g.title} (${g.source})${g.url ? ` — ${g.url}` : ''}`);
  const text = gigs.length
    ? `🎯 GigHunter: ${gigs.length} new gig(s) worth a look\n\n${lines.join('\n')}`
    : '🎯 GigHunter: no new high-scoring gigs this cycle.';
  return { count: gigs.length, text, gigs };
}

// Format the payload for the detected provider.
function payloadFor(url, text) {
  // ClickUp chat/webhook accepts a plain JSON body; Slack uses {text}; Discord uses {content}.
  if (url.includes('clickup.com')) return { content: text, text };
  if (url.includes('hooks.slack.com')) return { text };
  if (url.includes('discord')) return { content: text };
  return { text, content: text }; // safe default covers most incoming webhooks
}

export async function sendDigest(opts = {}) {
  const digest = buildDigest(opts);
  console.log('\n' + digest.text + '\n');

  const url = process.env.DIGEST_WEBHOOK_URL;
  if (url && digest.count) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(url, digest.text)),
      });
      logger.info('digest delivered to webhook');
    } catch (e) {
      logger.warn(`digest webhook failed: ${e.message}`);
    }
  }
  return digest;
}
