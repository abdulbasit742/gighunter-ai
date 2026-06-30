import { test } from 'node:test';
import assert from 'node:assert';
import { computeStats } from '../src/lib/analytics.js';
import { store } from '../src/lib/store.js';

// Seed a few gigs with known statuses.
test('computeStats derives win rate and pipeline', () => {
  store.upsertGigs([
    { id: 'a1', title: 'node saas api', description: 'node saas', source: 'RemoteOK', score: 80 },
    { id: 'a2', title: 'react dashboard', description: 'react', source: 'RemoteOK', score: 70 },
    { id: 'a3', title: 'whatsapp tool', description: 'whatsapp broadcast', source: 'Remotive', score: 90 },
  ]);
  store.setStatus('a1', 'won');
  store.setStatus('a2', 'applied');
  store.setStatus('a3', 'won');

  const profile = { skills: ['node', 'react', 'whatsapp'], preferredKeywords: ['saas', 'dashboard'] };
  const stats = computeStats(profile);

  assert.ok(stats.totals.gigs >= 3);
  assert.equal(stats.totals.won >= 2, true);
  // applied = applied + won = 3, won = 2 -> winRate ~0.67
  assert.ok(stats.winRate > 0 && stats.winRate <= 1);
  assert.ok(Array.isArray(stats.platforms) && stats.platforms.length >= 1);
  assert.ok(stats.pipeline.find((p) => p.stage === 'won'));
});
