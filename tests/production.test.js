import { test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/server.js';
import { validateSourceUrl } from '../src/lib/sources.js';

test('server disables framework fingerprinting', () => {
  assert.equal(app.get('x-powered-by'), false);
});

test('unsafe source protocols are rejected before network access', async () => {
  await assert.rejects(() => validateSourceUrl('file:///etc/passwd'), /http or https/);
  await assert.rejects(() => validateSourceUrl('javascript:alert(1)'), /http or https/);
});

test('root endpoint remains GET-only', () => {
  const layer = app._router.stack.find((entry) => entry.route?.path === '/');
  assert.ok(layer, 'root route should exist');
  assert.equal(layer.route.methods.get, true);
  assert.equal(Object.keys(layer.route.methods).length, 1);
});
