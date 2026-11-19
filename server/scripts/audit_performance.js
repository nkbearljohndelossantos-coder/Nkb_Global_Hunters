import { createApp } from '../src/app.js';
import { initDatabase, getOne, query } from '../src/db/index.js';

async function auditPerformance() {
  console.log('=== PERFORMANCE & CONCURRENCY AUDIT START ===');
  await initDatabase();

  const app = createApp();
  let server;
  let port;
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  const baseUrl = `http://localhost:${port}/api`;

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nkb-hunter.local', password: 'Admin@NKB2026!' })
  });
  const { token } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${token}` };

  // 1. Pagination Response Time
  console.log('\n[1/3] Server-Side Pagination Latency:');
  for (const page of [1, 2]) {
    const start = Date.now();
    const res = await fetch(`${baseUrl}/companies?page=${page}&limit=10`, { headers });
    const dur = Date.now() - start;
    const data = await res.json();
    console.log(`  Page ${page} (10 items): ${dur}ms (Total DB records: ${data.pagination?.totalCount})`);
  }

  // 2. Concurrent Requests Stress Test (50 simultaneous requests)
  console.log('\n[2/3] Concurrency Benchmark (50 simultaneous requests):');
  const reqStart = Date.now();
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(fetch(`${baseUrl}/dashboard/metrics`, { headers }));
  }

  const responses = await Promise.all(promises);
  const totalDuration = Date.now() - reqStart;
  const all200 = responses.every(r => r.status === 200);

  console.log(`  50 Concurrent API Calls Total Duration: ${totalDuration}ms`);
  console.log(`  Average Latency per Request: ${(totalDuration / 50).toFixed(2)}ms`);
  console.log(`  All Requests Succeeded with HTTP 200: ${all200}`);

  // 3. Memory Usage
  console.log('\n[3/3] Node.js Process Memory Footprint:');
  const mem = process.memoryUsage();
  console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  server.close();
  console.log('\n=== PERFORMANCE & CONCURRENCY AUDIT END ===');
  process.exit(0);
}

auditPerformance().catch(console.error);
