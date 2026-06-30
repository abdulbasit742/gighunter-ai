// Core hunt cycle, importable by both the CLI and the API.
import { fetchAll } from '../src/lib/sources.js';
import { scoreGig } from '../src/lib/scorer.js';
import { draftProposal } from '../src/lib/proposal.js';
import { store } from '../src/lib/store.js';
import { loadProfile } from '../src/lib/profile.js';
import { sendDigest } from '../src/lib/digest.js';
import { logger } from '../src/lib/logger.js';

export async function runHunt({ useLLM = true, useSemantic = true, digest = true } = {}) {
  const profile = loadProfile();
  const minDraft = Number(process.env.MIN_SCORE_TO_DRAFT || 65);

  const gigs = await fetchAll(profile.sources || []);
  const scored = [];
  for (const gig of gigs) {
    const { score, reasons, redFlags } = await scoreGig(gig, profile, { useLLM, useSemantic });
    scored.push({ ...gig, score, reasons, redFlags });
  }
  scored.sort((a, b) => b.score - a.score);
  const { total, added } = store.upsertGigs(scored);

  // Auto-draft proposals for strong NEW gigs only.
  const drafted = [];
  for (const gig of store.listGigs({ status: 'new' }).filter((g) => g.score >= minDraft).slice(0, 10)) {
    if (store.getProposal(gig.id)) continue;
    const proposal = await draftProposal(gig, profile);
    store.saveProposal(proposal);
    drafted.push({ gigId: gig.id, title: gig.title, score: gig.score });
  }

  let digestResult = null;
  if (digest) digestResult = await sendDigest({ minScore: minDraft });

  logger.info(`hunt: ${scored.length} scored, ${added} new, ${drafted.length} drafted`);
  return {
    huntedAt: new Date().toISOString(),
    totalGigs: total,
    newGigs: added,
    topGigs: scored.slice(0, 10).map((g) => ({ id: g.id, title: g.title, score: g.score, url: g.url, source: g.source })),
    draftedProposals: drafted,
    digest: digestResult ? { count: digestResult.count } : null,
  };
}
