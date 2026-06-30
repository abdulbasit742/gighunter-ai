// Draft tailored, human-sounding proposals using the LLM hub.
// Portfolio-aware + supports multiple tone variants so you can pick the best angle.
import { generate } from './llmHub.js';
import { relevantSamples } from './portfolio.js';

export const TONES = {
  concise: 'Punchy and direct. 80-110 words. Lead with the outcome you deliver. No fluff.',
  warm: 'Friendly and personable. 130-170 words. Build rapport, sound like a human who genuinely read the post.',
  technical: 'Credibility-first. 130-170 words. Show you understand the technical problem and outline a brief approach.',
};

function buildPrompt(gig, profile, tone) {
  const samples = relevantSamples(gig, 2);
  const proofBlock = samples.length
    ? `\nRelevant past work to reference (weave in ONE naturally, never as a list):\n${samples.map((s) => `- ${s.title}: ${s.summary}${s.url ? ` (${s.url})` : ''}`).join('\n')}`
    : '';
  return {
    samples,
    prompt: [
      `You are ${profile.name}, ${profile.headline}.`,
      `Write a freelance proposal for the gig below.`,
      `TONE: ${TONES[tone] || TONES.warm}`,
      `Rules: no buzzwords, no "Dear Sir/Madam", reference one concrete detail from the posting, end with a light call to action. Never invent fake client names or metrics.`,
      `Your relevant skills: ${(profile.skills || []).join(', ')}.`,
      proofBlock,
      ``,
      `GIG TITLE: ${gig.title}`,
      `GIG DESCRIPTION: ${gig.description}`,
    ].join('\n'),
  };
}

export async function draftProposal(gig, profile, { tone = 'warm' } = {}) {
  const { prompt, samples } = buildPrompt(gig, profile, tone);
  const body = await generate(prompt);
  return {
    gigId: gig.id,
    gigTitle: gig.title,
    tone,
    body,
    citedSamples: samples.map((s) => s.title),
    draftedAt: new Date().toISOString(),
  };
}

// Generate several tone variants in parallel so the user can choose the best.
export async function draftVariants(gig, profile, tones = ['concise', 'warm', 'technical']) {
  const results = await Promise.all(tones.map(async (tone) => {
    try { return await draftProposal(gig, profile, { tone }); }
    catch (e) { return { gigId: gig.id, tone, body: '', error: e.message }; }
  }));
  return { gigId: gig.id, gigTitle: gig.title, variants: results, draftedAt: new Date().toISOString() };
}
