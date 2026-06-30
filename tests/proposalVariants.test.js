import { test } from 'node:test';
import assert from 'node:assert';
import { draftVariants, TONES } from '../src/lib/proposal.js';

test('draftVariants returns one entry per requested tone (dry-run safe)', async () => {
  process.env.LLM_DRY_RUN = 'true';
  const gig = { id: 'v1', title: 'Build a SaaS API', description: 'node.js saas api with postgres' };
  const profile = { name: 'Dev', headline: 'Full-stack dev', skills: ['node.js', 'saas'] };
  const out = await draftVariants(gig, profile, ['concise', 'warm', 'technical']);
  assert.equal(out.variants.length, 3);
  assert.deepEqual(out.variants.map(v => v.tone), ['concise', 'warm', 'technical']);
  for (const v of out.variants) assert.ok(typeof v.body === 'string');
});

test('TONES exposes the expected presets', () => {
  assert.ok(TONES.concise && TONES.warm && TONES.technical);
});
