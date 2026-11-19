import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { initDatabase, getOne } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Authentication & RBAC Acceptance Tests', () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    await initDatabase();
    await runMigrations();
    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  test('GET /health returns status UP and service identity', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'UP');
    assert.strictEqual(data.service, 'NKB GLOBAL HUNTER API');
  });

  test('POST /auth/login fails on invalid credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nkb-hunter.local', password: 'WrongPassword123!' })
    });
    assert.strictEqual(res.status, 401);
  });

  test('POST /auth/login succeeds with valid admin credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nkb-hunter.local', password: 'Admin@NKB2026!' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, 'Token must be provided');
    assert.strictEqual(data.user.email, 'admin@nkb-hunter.local');
    assert.strictEqual(data.user.roleName, 'Administrator');
  });

  test('GET /auth/me returns authenticated user details', async () => {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nkb-hunter.local', password: 'Admin@NKB2026!' })
    });
    const { token } = await loginRes.json();

    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.email, 'admin@nkb-hunter.local');
  });

  test('Unauthenticated access to protected routes returns 401', async () => {
    const res = await fetch(`${baseUrl}/dashboard/metrics`);
    assert.strictEqual(res.status, 401);
  });
});
