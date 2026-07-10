import { test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/server.js';
import { validateSourceUrl } from '../src/lib/sources.js';

async function withServer(run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('health responds with hardened headers and no framework leak', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-powered-by'), null);
  });
});

test('oversized JSON is rejected', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/hunt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payload: 'x'.repeat(300_000) }),
    });
    assert.equal(response.status, 413);
  });
});

test('private and unsafe source URLs are blocked', async () => {
  await assert.rejects(() => validateSourceUrl('file:///etc/passwd'), /http or https/);
  await assert.rejects(() => validateSourceUrl('http://127.0.0.1:11434/api/tags'), /private\/local/);
});
