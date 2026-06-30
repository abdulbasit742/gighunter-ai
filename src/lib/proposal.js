// Draft a tailored, human-sounding proposal for a gig using the LLM hub.
// Now portfolio-aware: cites your most relevant past work for credibility.
import { generate } from './llmHub.js';
import { relevantSamples } from './portfolio.js';

export async function draftProposal(gig, profile) {
  const samples = relevantSamples(gig, 2);
  const proofBlock = samples.length
    ? `\nRelevant past work you can reference (use naturally, don't dump as a list):\n${samples.map((s) => `- ${s.title}: ${s.summary}${s.url ? ` (${s.url})` : ''}`).join('\n')}`
    : '';

  const prompt = [
    `You are ${profile.name}, ${profile.headline}.`,
    `Write a short, warm, confident freelance proposal (120-170 words) for the gig below.`,
    `Rules: no buzzwords, no "Dear Sir/Madam", sound like a real human, reference one concrete detail from the posting, weave in ONE relevant past project as proof if provided, end with a light call to action. Do NOT invent fake client names or fake metrics.`,
    `Your relevant skills: ${(profile.skills || []).join(', ')}.`,
    proofBlock,
    ``,
    `GIG TITLE: ${gig.title}`,
    `GIG DESCRIPTION: ${gig.description}`,
  ].join('\n');

  const body = await generate(prompt);
  return {
    gigId: gig.id,
    gigTitle: gig.title,
    body,
    citedSamples: samples.map((s) => s.title),
    draftedAt: new Date().toISOString(),
  };
}
