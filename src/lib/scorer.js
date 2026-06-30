// Score a gig 0-100 against the profile.
// Fast heuristic pass first (free), then optional LLM refinement for borderline gigs.
import { generate } from './llmHub.js';

function text(gig) {
  return `${gig.title} ${gig.description}`.toLowerCase();
}

export function heuristicScore(gig, profile) {
  const t = text(gig);
  let score = 30;
  const reasons = [];
  const redFlags = [];

  // skill matches
  const skillHits = (profile.skills || []).filter((s) => t.includes(s.toLowerCase()));
  score += Math.min(35, skillHits.length * 9);
  if (skillHits.length) reasons.push(`skills: ${skillHits.join(', ')}`);

  // preferred keywords
  const prefHits = (profile.preferredKeywords || []).filter((k) => t.includes(k.toLowerCase()));
  score += Math.min(20, prefHits.length * 5);
  if (prefHits.length) reasons.push(`keywords: ${prefHits.join(', ')}`);

  // avoid keywords
  const avoidHits = (profile.avoidKeywords || []).filter((k) => t.includes(k.toLowerCase()));
  if (avoidHits.length) { score -= avoidHits.length * 20; redFlags.push(`avoid: ${avoidHits.join(', ')}`); }

  // budget
  if (gig.budgetUsd != null && profile.minBudgetUsd != null) {
    if (gig.budgetUsd >= profile.minBudgetUsd) { score += 8; reasons.push(`budget $${gig.budgetUsd}`); }
    else { score -= 10; redFlags.push(`budget below min ($${gig.budgetUsd})`); }
  }

  // freshness
  if (gig.postedAt) {
    const ageDays = (Date.now() - new Date(gig.postedAt).getTime()) / 86400000;
    if (ageDays <= 3) { score += 7; reasons.push('fresh (<3d)'); }
    else if (ageDays > 30) { score -= 8; redFlags.push('stale (>30d)'); }
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, redFlags };
}

export async function scoreGig(gig, profile, { useLLM = false } = {}) {
  const base = heuristicScore(gig, profile);
  if (!useLLM) return base;

  // LLM refinement only for borderline gigs (45-75) to save compute.
  if (base.score < 45 || base.score > 75) return base;
  const prompt = `You are a freelancing assistant. Score this gig 0-100 for fit.\nProfile skills: ${(profile.skills||[]).join(', ')}.\nMin budget: $${profile.minBudgetUsd}.\nGig title: ${gig.title}\nGig description: ${gig.description}\nReturn ONLY JSON: {"score": number, "reasons": string[], "redFlags": string[]}`;
  try {
    const out = await generate(prompt, { json: true });
    const parsed = JSON.parse(out);
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score ?? base.score))),
      reasons: [...new Set([...(base.reasons||[]), ...(parsed.reasons||[])])],
      redFlags: [...new Set([...(base.redFlags||[]), ...(parsed.redFlags||[])])],
    };
  } catch {
    return base;
  }
}
