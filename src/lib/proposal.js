// Draft tailored, human-sounding proposals using the LLM hub.
import { generate } from './llmHub.js';
import { relevantSamples } from './portfolio.js';
import { proposalMessages, validateDraftOutput } from './promptSafety.js';

export const TONES = {
  concise: 'Punchy and direct. 80-110 words. Lead with the outcome you deliver. No fluff.',
  warm: 'Friendly and personable. 130-170 words. Build rapport, sound like a human who genuinely read the post.',
  technical: 'Credibility-first. 130-170 words. Show you understand the technical problem and outline a brief approach.',
};

function buildPrompt(gig, profile, tone) {
  const samples = relevantSamples(gig, 2);
  const proofLines = samples.map((sample) =>
    `${sample.title}: ${sample.summary}${sample.url ? ` (${sample.url})` : ''}`
  );
  const messages = proposalMessages(gig, profile, TONES[tone] || TONES.warm, proofLines);
  return { samples, ...messages };
}

export async function draftProposal(gig, profile, { tone = 'warm' } = {}) {
  const { system, user, samples, assessment } = buildPrompt(gig, profile, tone);
  const body = validateDraftOutput(await generate({ system, user }));
  return {
    gigId: gig.id,
    gigTitle: assessment.title,
    tone,
    body,
    citedSamples: samples.map((sample) => sample.title),
    safety: { risk: assessment.risk, flags: assessment.flags.map((flag) => flag.id) },
    draftedAt: new Date().toISOString(),
  };
}

export async function draftVariants(gig, profile, tones = ['concise', 'warm', 'technical']) {
  const results = await Promise.all(tones.map(async (tone) => {
    try {
      return await draftProposal(gig, profile, { tone });
    } catch (error) {
      return {
        gigId: gig.id,
        tone,
        body: '',
        error: error.message,
        errorCode: error.code || 'draft_failed',
      };
    }
  }));
  return { gigId: gig.id, gigTitle: gig.title, variants: results, draftedAt: new Date().toISOString() };
}
