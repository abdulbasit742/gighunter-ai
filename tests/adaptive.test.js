import { test } from 'node:test';
import assert from 'node:assert';
import { learnModel, adaptiveAdjust } from '../src/lib/adaptive.js';
import { store } from '../src/lib/store.js';

test('adaptive learns from won/rejected and boosts similar gigs', () => {
  store.upsertGigs([
    { id: 'w1', title: 'whatsapp broadcast saas', description: 'whatsapp broadcast messaging saas platform', source: 'Remotive', score: 80 },
    { id: 'w2', title: 'whatsapp blast tool', description: 'whatsapp broadcast messaging automation', source: 'Remotive', score: 75 },
    { id: 'w3', title: 'whatsapp campaign manager', description: 'whatsapp broadcast saas messaging', source: 'Remotive', score: 78 },
    { id: 'r1', title: 'wordpress blog setup', description: 'wordpress theme install blog', source: 'RemoteOK', score: 50 },
  ]);
  store.setStatus('w1', 'won');
  store.setStatus('w2', 'won');
  store.setStatus('w3', 'won');
  store.setStatus('r1', 'rejected');

  const model = learnModel();
  assert.ok(model.samples >= 4);

  const similar = { title: 'new whatsapp broadcast saas gig', description: 'whatsapp broadcast messaging saas', source: 'Remotive' };
  const unlike = { title: 'wordpress blog', description: 'wordpress theme blog', source: 'RemoteOK' };
  const a = adaptiveAdjust(similar, model);
  const b = adaptiveAdjust(unlike, model);
  assert.ok(a.delta > b.delta, `expected won-like gig to score higher (${a.delta} vs ${b.delta})`);
});

test('adaptive is a no-op with too little history', () => {
  const tiny = { tokenWeights: {}, platformWeights: {}, samples: 1 };
  assert.equal(adaptiveAdjust({ title: 'x', description: 'y' }, tiny).delta, 0);
});
