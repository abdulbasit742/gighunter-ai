import { test } from 'node:test';
import assert from 'node:assert';
import { scanGig } from '../src/lib/scamFilter.js';

test('flags upfront-fee scams as avoid', () => {
  const gig = { title: 'Remote job', description: 'Pay a small registration fee to start. Earn $500 per day, no experience needed!' };
  const r = scanGig(gig);
  assert.equal(r.verdict, 'avoid');
  assert.ok(r.flags.length >= 2);
});

test('flags off-platform + sketchy payment', () => {
  const gig = { title: 'Quick gig', description: 'Contact me on telegram directly. Payment via gift card only.' };
  const r = scanGig(gig);
  assert.ok(r.risk >= 45);
  assert.equal(r.verdict, 'avoid');
});

test('clean legit gig passes', () => {
  const gig = { title: 'Build a Node.js REST API', description: 'We need an experienced developer to build a documented REST API with Postgres and tests. Budget negotiable, paid through the platform.' };
  const r = scanGig(gig);
  assert.equal(r.verdict, 'clean');
  assert.equal(r.flags.length, 0);
});
