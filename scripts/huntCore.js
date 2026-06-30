// Core hunt cycle, importable by both the CLI and the API.
import { fetchAll } from '../src/lib/sources.js';
import { scoreGig } from '../src/lib/scorer.js';
import { draftProposal } from '../src/lib/proposal.js';
import { store } from '../src/lib/store.js';
import { loadProfile } from '../src/lib/profile.js';
import { logger } from '../src/lib/logger.js';

export async function runHunt({ useLLM = true } = {}) {
  const profile = loadProfile();
  const minDraft = Number(process.env.MIN_SCORE_TO_DRAFT || 65);

  const gigs = await fetchAll(profile.sources || []);
  const scored = [];
  for (const gig of gigs) {
    const { score, reasons, redFlags } = await scoreGig(gig, profile, { useLLM });
    scored.push({ ...gig, score, reasons, redFlags });
  }
  scored.sort((a, b) => b.score - a.score);
  store.upsertGigs(scored);

  // Auto-draft proposals for the strong ones.
  const drafted = [];
  for (const gig of scored.filter((g) => g.score >= minDraft).slice(0, 10)) {
    const proposal = await draftProposal(gig, profile);
    store.saveProposal(proposal);
    drafted.push({ gigId: gig.id, title: gig.title, score: gig.score });
  }

  logger.info(`hunt complete: ${scored.length} gigs scored, ${drafted.length} proposals drafted`);
  return {
    huntedAt: new Date().toISOString(),
    totalGigs: scored.length,
    topGigs: scored.slice(0, 10).map((g) => ({ id: g.id, title: g.title, score: g.score, url: g.url, source: g.source })),
    draftedProposals: drafted,
  };
}
