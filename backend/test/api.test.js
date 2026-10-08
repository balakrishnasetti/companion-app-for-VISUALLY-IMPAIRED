const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint returns a successful service status without a database query', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok', service: 'BALA API' } });
});

test('protected user and admin APIs reject requests without authentication', async () => {
  for (const path of ['/api/auth/me', '/api/users/me', '/api/admin/dashboard', '/api/hazards', '/api/volunteers/ai-assist']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 401, path);
    assert.equal((await response.json()).success, false);
  }
});

test('AI volunteer prompt requires authentication before consent or provider processing', async () => {
  const response = await fetch(`${baseUrl}/api/volunteers/ai-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: 'ai-request-test-1',
      message: 'Help me find a volunteer.',
      language: 'en',
      consent: true,
    }),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).success, false);
});

test('invalid registration input is rejected before database access', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'not-an-email', password: 'short' }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
});

test('unknown API routes return a safe 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { success: false, message: 'The requested API endpoint was not found.' });
});
