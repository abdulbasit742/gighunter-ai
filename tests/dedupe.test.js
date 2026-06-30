import { test } from 'node:test';
import assert from 'node:assert';
import { isDuplicate, dedupeGigs } from '../src/lib/dedupe.js';

test('isDuplicate catches same job across platforms', () => {
  const a = { title: 'Senior Node.js Developer (Remote)', company: 'Acme', description: 'build apis' };
  const b = { title: 'Node.js Developer', company: 'Acme', description: 'build apis and services' };
  assert.equal(isDuplicate(a, b), true);
});

test('isDuplicate keeps genuinely different gigs apart', () => {
  const a = { title: 'React Frontend Engineer', company: 'Acme', description: 'ui work' };
  const b = { title: 'Python Data Pipeline Engineer', company: 'Beta', description: 'etl work' };
  assert.equal(isDuplicate(a, b), false);
});

test('dedupeGigs merges sources and keeps one row', () => {
  const gigs = [
    { id: '1', title: 'Full Stack SaaS Developer', company: 'X', description: 'short', url: 'http://a', source: 'RemoteOK' },
    { id: '2', title: 'Full Stack SaaS Developer (Remote)', company: 'X', description: 'a much longer description here', url: 'http://b', source: 'WeWorkRemotely' },
    { id: '3', title: 'Android Engineer', company: 'Y', description: 'mobile', url: 'http://c', source: 'Remotive' },
  ];
  const out = dedupeGigs(gigs);
  assert.equal(out.length, 2);
  const merged = out.find((g) => g.title.includes('Full Stack'));
  assert.ok(merged.sources.length === 2, 'should record both sources');
  assert.ok(merged.description.length > 'short'.length, 'should keep the richer description');
  assert.equal(merged.altUrls.length, 2);
});
