// Score a gig 0-100 against the profile.
import { generate } from './llmHub.js';
import { embed, cosine, profileVector } from './embeddings.js';
import { adaptiveAdjust } from './adaptive.js';
import { assessGigContent, scoringMessages, validateScoreResponse } from './promptSafety.js';

function safeGigText(gig) {
  const assessment = assessGigContent(gig);
  return { assessment, text: `${assessment.title} ${assessment.description}`.toLowerCase() };
}

export function heuristicScore(gig, profile) {
  const { assessment, text: t } = safeGigText(gig);
  let score = 30;
  const reasons = [];
  const redFlags = assessment.flags.map((flag) => `content safety: ${flag.id}`);

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

  if (assessment.risk === 'high') score = Math.min(score, 35);
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    redFlags,
    contentSafety: { risk: assessment.risk, flags: assessment.flags.map((flag) => flag.id) },
  };
}

async function semanticBoost(gig, profile) {
  try {
    const assessment = assessGigContent(gig);
    const pv = await profileVector(profile);
    if (!pv) return { boost: 0, sim: null };
    const gv = await embed(`${assessment.title}. ${assessment.description}`);
    const sim = cosine(pv, gv);
    return { boost: Math.round(sim * 25), sim: Number(sim.toFixed(3)) };
  } catch {
    return { boost: 0, sim: null };
  }
}

export async function scoreGig(gig, profile, { useLLM = false, useSemantic = true, model = null } = {}) {
  const base = heuristicScore(gig, profile);
  let score = base.score;
  const reasons = [...base.reasons];
  const redFlags = [...base.redFlags];

  if (useSemantic) {
    const { boost, sim } = await semanticBoost(gig, profile);
    if (boost) { score = Math.min(100, score + boost); reasons.push(`semantic match ${sim}`); }
  }

  const { delta, reasons: aReasons } = adaptiveAdjust(gig, model);
  if (delta) { score = Math.max(0, Math.min(100, score + delta)); reasons.push(...aReasons); }

  if (useLLM && base.contentSafety.risk !== 'high' && score >= 45 && score <= 80) {
    try {
      const { system, user } = scoringMessages(gig, profile);
      const parsed = validateScoreResponse(await generate({ system, user }, { json: true }));
      score = Math.round((score + parsed.score) / 2);
      for (const reason of parsed.reasons) if (!reasons.includes(reason)) reasons.push(reason);
      for (const flag of parsed.redFlags) if (!redFlags.includes(flag)) redFlags.push(flag);
    } catch {
      // Keep deterministic score when model output is unavailable or invalid.
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
    redFlags,
    contentSafety: base.contentSafety,
  };
}
