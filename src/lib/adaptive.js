// Self-learning layer. GigHunter watches which gigs you WON vs REJECTED and
// nudges future scores toward what actually pays. No retraining, just a light,
// explainable feedback loop computed from your own history.
import { store } from './store.js';

const STOP = new Set(['the','and','for','with','you','your','our','are','will','that','this','have','from','need','looking','want','must','able','work','project','remote','team','using','into','also','etc','a','an','to','of','in','on','is','be','we','us']);

function tokens(gig) {
  return `${gig.title} ${gig.description}`
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

// Build a learned model from history: which tokens & platforms correlate with wins.
// Returns { tokenWeights: {tok: weight -5..+5}, platformWeights: {src: -5..+5}, samples }.
export function learnModel() {
  const gigs = store.listGigs();
  const won = gigs.filter((g) => g.status === 'won');
  const lost = gigs.filter((g) => g.status === 'rejected');
  const samples = won.length + lost.length;

  const tokenWeights = {};
  const platformWeights = {};
  if (samples < 3) return { tokenWeights, platformWeights, samples }; // not enough signal yet

  const bump = (map, key, delta) => { map[key] = (map[key] || 0) + delta; };

  for (const g of won) {
    for (const t of new Set(tokens(g))) bump(tokenWeights, t, 1);
    bump(platformWeights, g.source || 'unknown', 1);
  }
  for (const g of lost) {
    for (const t of new Set(tokens(g))) bump(tokenWeights, t, -0.7);
    bump(platformWeights, g.source || 'unknown', -0.7);
  }

  // Clamp to a sane range so one lucky win can't dominate.
  const clamp = (v) => Math.max(-5, Math.min(5, Number(v.toFixed(2))));
  for (const k of Object.keys(tokenWeights)) tokenWeights[k] = clamp(tokenWeights[k]);
  for (const k of Object.keys(platformWeights)) platformWeights[k] = clamp(platformWeights[k]);
  return { tokenWeights, platformWeights, samples };
}

// Apply the learned model to a single gig -> { delta, reasons } where delta is
// bounded to +/-15 so learning refines but never overrides the base score.
export function adaptiveAdjust(gig, model) {
  if (!model || model.samples < 3) return { delta: 0, reasons: [] };
  const toks = new Set(tokens(gig));
  let delta = 0;
  const hits = [];
  for (const t of toks) {
    const w = model.tokenWeights[t];
    if (w) { delta += w; if (Math.abs(w) >= 2) hits.push(`${w > 0 ? '+' : ''}${t}`); }
  }
  const pw = model.platformWeights[gig.source];
  if (pw) delta += pw;

  delta = Math.max(-15, Math.min(15, Math.round(delta)));
  const reasons = [];
  if (delta) reasons.push(`learned ${delta > 0 ? '+' : ''}${delta}${hits.length ? ` (${hits.slice(0, 4).join(', ')})` : ''}`);
  return { delta, reasons };
}
