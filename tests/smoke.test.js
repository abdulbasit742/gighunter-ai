import { test } from 'node:test';
import assert from 'node:assert';
import { heuristicScore } from '../src/lib/scorer.js';
import { draftProposal } from '../src/lib/proposal.js';

const profile = {
  name: 'Test Dev',
  headline: 'Full-stack dev',
  skills: ['node.js', 'react', 'saas'],
  minBudgetUsd: 300,
  preferredKeywords: ['saas', 'api'],
  avoidKeywords: ['unpaid'],
};

test('heuristicScore rewards skill + keyword matches', () => {
  const gig = { title: 'Build a SaaS API', description: 'Need node.js and react for a saas api', budgetUsd: 1000, postedAt: new Date().toISOString() };
  const { score } = heuristicScore(gig, profile);
  assert.ok(score >= 65, `expected high score, got ${score}`);
});

test('heuristicScore penalizes avoid keywords', () => {
  const gig = { title: 'Unpaid internship', description: 'unpaid work for exposure', budgetUsd: 0, postedAt: new Date().toISOString() };
  const { score, redFlags } = heuristicScore(gig, profile);
  assert.ok(score < 50, `expected low score, got ${score}`);
  assert.ok(redFlags.length > 0);
});

test('draftProposal returns a body (mock/dry-run safe)', async () => {
  process.env.LLM_DRY_RUN = 'true';
  const gig = { id: 'x1', title: 'SaaS work', description: 'node.js saas api' };
  const p = await draftProposal(gig, profile);
  assert.ok(typeof p.body === 'string' && p.body.length > 10);
  assert.equal(p.gigId, 'x1');
});
