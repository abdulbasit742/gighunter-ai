// Draft a tailored, human-sounding proposal for a gig using the LLM hub.
import { generate } from './llmHub.js';

export async function draftProposal(gig, profile) {
  const prompt = [
    `You are ${profile.name}, ${profile.headline}.`,
    `Write a short, warm, confident freelance proposal (120-160 words) for the gig below.`,
    `Rules: no buzzwords, no "Dear Sir/Madam", sound like a real human, reference one concrete detail from the posting, end with a light call to action. Do NOT invent fake client names.`,
    `Your relevant skills: ${(profile.skills || []).join(', ')}.`,
    ``,
    `GIG TITLE: ${gig.title}`,
    `GIG DESCRIPTION: ${gig.description}`,
  ].join('\n');

  const body = await generate(prompt);
  return {
    gigId: gig.id,
    gigTitle: gig.title,
    body,
    draftedAt: new Date().toISOString(),
  };
}
