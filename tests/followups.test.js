import { test } from 'node:test';
import assert from 'node:assert';
import { store } from '../src/lib/store.js';
import { dueFollowups, followupText } from '../src/lib/followups.js';

test('dueFollowups surfaces an applied gig past the window', () => {
  store.upsertGigs([{ id: 'fu1', title: 'Old applied gig', description: 'node saas', source: 'RemoteOK', score: 80 }]);
  store.setStatus('fu1', 'applied');
  // Backdate the applied time to 5 days ago.
  store.patchGig('fu1', { appliedAt: new Date(Date.now() - 5 * 86400000).toISOString() });

  const due = dueFollowups({ firstAfterDays: 3 });
  assert.ok(due.find((d) => d.gig.id === 'fu1'), 'should be due for a first follow-up');
});

test('a freshly applied gig is NOT due yet', () => {
  store.upsertGigs([{ id: 'fu2', title: 'Fresh apply', description: 'react', source: 'Remotive', score: 70 }]);
  store.setStatus('fu2', 'applied'); // appliedAt = now
  const due = dueFollowups({ firstAfterDays: 3 });
  assert.ok(!due.find((d) => d.gig.id === 'fu2'), 'fresh apply should not be due');
});

test('followupText is human and references the gig', () => {
  const msg = followupText({ title: 'WhatsApp SaaS' }, 1);
  assert.ok(msg.includes('WhatsApp SaaS'));
  assert.ok(msg.length > 30);
});
