// Analytics: turn gig status history into insight.
// What's working, where to spend time, and how the pipeline looks.
import { store } from './store.js';

const PIPELINE = ['new', 'seen', 'applied', 'won', 'rejected'];

function tally(gigs, key) {
  const map = {};
  for (const g of gigs) {
    const k = g[key] || 'unknown';
    map[k] = (map[k] || 0) + 1;
  }
  return map;
}

// Win rate per platform: won / applied (applied includes won).
function ratesByPlatform(gigs) {
  const stat = {};
  for (const g of gigs) {
    const p = g.source || 'unknown';
    stat[p] = stat[p] || { applied: 0, won: 0, total: 0, avgScore: 0, _scoreSum: 0 };
    stat[p].total++;
    stat[p]._scoreSum += g.score || 0;
    if (['applied', 'won'].includes(g.status)) stat[p].applied++;
    if (g.status === 'won') stat[p].won++;
  }
  return Object.entries(stat).map(([platform, s]) => ({
    platform,
    total: s.total,
    applied: s.applied,
    won: s.won,
    winRate: s.applied ? Number((s.won / s.applied).toFixed(2)) : 0,
    avgScore: s.total ? Math.round(s._scoreSum / s.total) : 0,
  })).sort((a, b) => b.won - a.won || b.winRate - a.winRate);
}

// Which keywords show up most in WON gigs -> double down on these.
function winningKeywords(gigs, profile) {
  const won = gigs.filter((g) => g.status === 'won');
  const pool = [...(profile.skills || []), ...(profile.preferredKeywords || [])].map((s) => s.toLowerCase());
  const counts = {};
  for (const g of won) {
    const t = `${g.title} ${g.description}`.toLowerCase();
    for (const kw of pool) if (t.includes(kw)) counts[kw] = (counts[kw] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([keyword, count]) => ({ keyword, count }));
}

export function computeStats(profile) {
  const gigs = store.listGigs();
  const byStatus = tally(gigs, 'status');
  const applied = (byStatus.applied || 0) + (byStatus.won || 0);
  const won = byStatus.won || 0;

  return {
    totals: {
      gigs: gigs.length,
      new: byStatus.new || 0,
      applied,
      won,
      rejected: byStatus.rejected || 0,
    },
    winRate: applied ? Number((won / applied).toFixed(2)) : 0,
    avgScore: gigs.length ? Math.round(gigs.reduce((s, g) => s + (g.score || 0), 0) / gigs.length) : 0,
    bySource: tally(gigs, 'source'),
    platforms: ratesByPlatform(gigs),
    winningKeywords: profile ? winningKeywords(gigs, profile) : [],
    pipeline: PIPELINE.map((s) => ({ stage: s, count: byStatus[s] || 0 })),
  };
}
