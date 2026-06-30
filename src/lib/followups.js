// Follow-up engine. Most freelancers apply once and go silent. A single, well-timed
// follow-up measurably lifts reply rates. GigHunter tracks when you marked a gig
// 'applied' and surfaces the ones that have gone quiet so you nudge at the right time.
import { store } from './store.js';

const DAY = 86400000;

// Gigs that are 'applied', have no recorded reply, and are past the follow-up window.
// Default: first nudge after 3 days, a second after 7, then stop.
export function dueFollowups({ firstAfterDays = 3, secondAfterDays = 7 } = {}) {
  const now = Date.now();
  const applied = store.listGigs({ status: 'applied' });
  const due = [];
  for (const g of applied) {
    const appliedAt = g.appliedAt ? new Date(g.appliedAt).getTime() : (g.firstSeen ? new Date(g.firstSeen).getTime() : null);
    if (!appliedAt) continue;
    const ageDays = (now - appliedAt) / DAY;
    const sent = g.followupsSent || 0;
    if (sent === 0 && ageDays >= firstAfterDays) due.push({ gig: g, nudge: 1, ageDays: Math.floor(ageDays) });
    else if (sent === 1 && ageDays >= secondAfterDays) due.push({ gig: g, nudge: 2, ageDays: Math.floor(ageDays) });
  }
  return due.sort((a, b) => b.gig.score - a.gig.score);
}

// Record that a follow-up was sent (increments the counter, stamps the time).
export function markFollowupSent(gigId) {
  const g = store.getGig(gigId);
  if (!g) return null;
  return store.patchGig(gigId, {
    followupsSent: (g.followupsSent || 0) + 1,
    lastFollowupAt: new Date().toISOString(),
  });
}

// A short follow-up message draft. Kept human and low-pressure.
export function followupText(gig, nudge) {
  if (nudge >= 2) {
    return `Hi! Circling back one last time on "${gig.gigTitle || gig.title}". If it's still open I'd love to help; if the timing's off, no worries at all and best of luck with it.`;
  }
  return `Hi! Following up on my note about "${gig.gigTitle || gig.title}". Still very interested and happy to answer anything or share relevant samples. Would love to help if it's still open.`;
}
