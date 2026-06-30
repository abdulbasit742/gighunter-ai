import { test } from 'node:test';
import assert from 'node:assert';
import { parseBudget, rateVerdict } from '../src/lib/budget.js';

test('parseBudget reads hourly rate', () => {
  const b = parseBudget({ title: 'Dev needed', description: 'Pay is $50/hr for the right person' });
  assert.equal(b.usd, 50);
  assert.equal(b.period, 'hour');
});

test('parseBudget reads k ranges', () => {
  const b = parseBudget({ title: 'Build app', description: 'Budget $2k-3k for the project' });
  assert.equal(b.min, 2000);
  assert.equal(b.max, 3000);
  assert.equal(b.usd, 2500);
});

test('parseBudget converts other currencies to USD', () => {
  const b = parseBudget({ title: 'x', description: 'around €4000 per month' });
  assert.ok(b.usd > 4000 && b.usd < 4600, `eur->usd, got ${b.usd}`);
  assert.equal(b.period, 'month');
});

test('rateVerdict flags low hourly', () => {
  const v = rateVerdict({ title: 'x', description: '$20/hr' }, { targetHourlyUsd: 50 });
  assert.equal(v.verdict, 'low');
});

test('rateVerdict rates strong project budget great', () => {
  const v = rateVerdict({ title: 'x', description: 'Budget $5000 fixed' }, { minBudgetUsd: 2000 });
  assert.equal(v.verdict, 'great');
});

test('rateVerdict unknown when no pay listed', () => {
  const v = rateVerdict({ title: 'x', description: 'great opportunity to join us' }, { targetHourlyUsd: 50 });
  assert.equal(v.verdict, 'unknown');
});
