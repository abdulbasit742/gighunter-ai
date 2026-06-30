import { test } from 'node:test';
import assert from 'node:assert';
import { relevantSamples } from '../src/lib/portfolio.js';

test('relevantSamples picks the best-matching past work', () => {
  // Uses config/portfolio.example.json (whatsapp/saas sample exists there).
  const gig = { title: 'Need a WhatsApp broadcast SaaS', description: 'multi-tenant whatsapp broadcast with stripe billing and postgres' };
  const out = relevantSamples(gig, 2);
  assert.ok(out.length >= 1, 'should find at least one relevant sample');
  assert.ok(out[0].title.toLowerCase().includes('supersender'), 'whatsapp gig should surface the SuperSender sample first');
});

test('relevantSamples returns empty for unrelated gig', () => {
  const gig = { title: 'Knitting pattern designer', description: 'wool yarn crochet patterns' };
  const out = relevantSamples(gig, 2);
  assert.equal(out.length, 0);
});
