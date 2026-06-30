// Score a gig 0-100 against the profile.
// Three signals, blended: heuristic (free) + semantic embedding match + optional LLM refine.
import { generate } from './llmHub.js';
import { embed, cosine, profileVector } from './embeddings.js';

function text(gig) {
  return `${gig.title} ${gig.description}`.toLowerCase();
}

export function heuristicScore(gig, profile) {
  const t = text(gig);
  let score = 30;
  const reasons = [];
  const redFlags = [];

  const skillHits = (profile.skills || []).filter((s) => t.includes(s.toLowerCase()));
  score += Math.min(35, skillHits.length * 9);
  if (skillHits.length) reasons.push(`skills: ${skillHits.join(', ')}`);

  const prefHits = (profile.preferredKeywords || []).filter((k) => t.includes(k.toLowerCase()));
  score += Math.min(20, prefHits.length * 5);
  if (prefHits.length) reasons.push(`keywords: ${prefHits.join(', ')}`);

  const avoidHits = (profile.avoidKeywords || []).filter((k) => t.includes(k.toLowerCase()));
  if (avoidHits.length) { score -= avoidHits.length * 20; redFlags.push(`avoid: ${avoidHits.join(', ')}`); }

  if (gig.budgetUsd != null && profile.minBudgetUsd != null) {
    if (gig.budgetUsd >= profile.minBudgetUsd) { score += 8; reasons.push(`budget $${gig.budgetUsd}`); }
    else { score -= 10; redFlags.push(`budget below min ($${gig.budgetUsd})`); }
  }

  if (gig.postedAt) {
    const ageDays = (Date.now() - new Date(gig.postedAt).getTime()) / 86400000;
    if (ageDays <= 3) { score += 7; reasons.push('fresh (<3d)'); }
    else if (ageDays > 30) { score -= 8; redFlags.push('stale (>30d)'); }
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, redFlags };
}

// Semantic similarity 0..1 -> contributes up to +25 to score.
async function semanticBoost(gig, profile) {
  try {
    const pv = await profileVector(profile);
    if (!pv) return { boost: 0, sim: null };
    const gv = await embed(`${gig.title}. ${gig.description}`);
    const sim = cosine(pv, gv);
    return { boost: Math.round(sim * 25), sim: Number(sim.toFixed(3)) };
  } catch {
    return { boost: 0, sim: null };
  }
}

export async function scoreGig(gig, profile, { useLLM = false, useSemantic = true } = {}) {
  const base = heuristicScore(gig, profile);
  let score = base.score;
  const reasons = [...base.reasons];
  const redFlags = [...base.redFlags];

  if (useSemantic) {
    const { boost, sim } = await semanticBoost(gig, profile);
    if (boost) { score = Math.min(100, score + boost); reasons.push(`semantic match ${sim}`); }
  }

  // LLM refine only for borderline gigs (45-80) to save compute.
  if (useLLM && score >= 45 && score <= 80) {
    const prompt = `Score this gig 0-100 for fit.\nProfile skills: ${(profile.skills||[]).join(', ')}. Min budget: $${profile.minBudgetUsd}.\nTitle: ${gig.title}\nDescription: ${gig.description}\nReturn ONLY JSON: {"score": number, "reasons": string[], "redFlags": string[]}`;
    try {
      const parsed = JSON.parse(await generate(prompt, { json: true }));
      score = Math.round((score + Math.max(0, Math.min(100, parsed.score ?? score))) / 2);
      for (const r of parsed.reasons || []) if (!reasons.includes(r)) reasons.push(r);
      for (const f of parsed.redFlags || []) if (!redFlags.includes(f)) redFlags.push(f);
    } catch { /* keep blended score */ }
  }

  return { score: Math.max(0, Math.min(100, score)), reasons, redFlags };
}
