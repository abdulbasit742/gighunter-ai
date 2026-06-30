// Core hunt cycle, importable by both the CLI and the API.
import { fetchAll } from '../src/lib/sources.js';
import { scoreGig } from '../src/lib/scorer.js';
import { draftProposal } from '../src/lib/proposal.js';
import { store } from '../src/lib/store.js';
import { loadProfile } from '../src/lib/profile.js';
import { sendDigest } from '../src/lib/digest.js';
import { learnModel } from '../src/lib/adaptive.js';
import { scanGig } from '../src/lib/scamFilter.js';
import { logger } from '../src/lib/logger.js';

export async function runHunt({ useLLM = true, useSemantic = true, digest = true } = {}) {
  const profile = loadProfile();
  const minDraft = Number(process.env.MIN_SCORE_TO_DRAFT || 65);

  const model = learnModel();
  if (model.samples >= 3) logger.info(`adaptive: learning from ${model.samples} decided gigs`);

  const gigs = await fetchAll(profile.sources || []);
  const scored = [];
  let flaggedCount = 0;
  for (const gig of gigs) {
    const { score, reasons, redFlags } = await scoreGig(gig, profile, { useLLM, useSemantic, model });
    // Risk scan: demote risky gigs and attach flags.
    const scan = scanGig(gig);
    let finalScore = score;
    if (scan.verdict === 'avoid') { finalScore = Math.min(finalScore, 25); flaggedCount++; }
    else if (scan.verdict === 'caution') { finalScore = Math.max(0, finalScore - 15); }
    scored.push({
      ...gig,
      score: finalScore,
      reasons,
      redFlags: [...redFlags, ...scan.flags],
      risk: scan.risk,
      verdict: scan.verdict,
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const { total, added } = store.upsertGigs(scored);

  // Only draft for clean/caution gigs above threshold.
  const drafted = [];
  for (const gig of store.listGigs({ status: 'new' }).filter((g) => g.score >= minDraft && g.verdict !== 'avoid').slice(0, 10)) {
    if (store.getProposal(gig.id)) continue;
    const proposal = await draftProposal(gig, profile);
    store.saveProposal(proposal);
    drafted.push({ gigId: gig.id, title: gig.title, score: gig.score });
  }

  let digestResult = null;
  if (digest) digestResult = await sendDigest({ minScore: minDraft });

  logger.info(`hunt: ${scored.length} scored, ${added} new, ${flaggedCount} risky, ${drafted.length} drafted`);
  return {
    huntedAt: new Date().toISOString(),
    totalGigs: total,
    newGigs: added,
    riskyGigs: flaggedCount,
    learnedFrom: model.samples,
    topGigs: scored.slice(0, 10).map((g) => ({ id: g.id, title: g.title, score: g.score, url: g.url, source: g.source, verdict: g.verdict })),
    draftedProposals: drafted,
    digest: digestResult ? { count: digestResult.count } : null,
  };
}
