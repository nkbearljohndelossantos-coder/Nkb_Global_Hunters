import { createApp } from '../src/app.js';
import { initDatabase, getOne } from '../src/db/index.js';

async function auditAllEndpoints() {
  console.log('=== FULL ENDPOINT FUNCTIONALITY AUDIT START ===');
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
  const admin = await getOne("SELECT * FROM users WHERE username = 'admin'");

  // 1. Authenticate to get JWT token
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nkb-hunter.local', password: 'Admin@NKB2026!' })
  });
  const { token } = await loginRes.json();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log('Logged in as Administrator. Testing all 17 Module APIs...\n');

  const testList = [
    { module: '1. Executive Dashboard', url: '/dashboard/metrics', method: 'GET' },
    { module: '1. Dashboard (Filtered)', url: '/dashboard/metrics?country=Philippines&industry=Cosmetics', method: 'GET' },
    { module: '2. Global Company Finder', url: '/discovery/search', method: 'POST', body: { country: 'Philippines', industry: 'Cosmetics', limit: 3 } },
    { module: '3. Company Intelligence', url: '/companies?limit=10', method: 'GET' },
    { module: '4. Enterprise Prospects', url: '/companies?tier=A', method: 'GET' },
    { module: '5. Contact Discovery', url: '/contacts', method: 'GET' },
    { module: '6. AI Research Agents Logs', url: '/agents/logs?limit=5', method: 'GET' },
    { module: '7. Market Reports', url: '/market/reports', method: 'GET' },
    { module: '7. Market Signals', url: '/market/signals', method: 'GET' },
    { module: '8. CRM Pipeline Board', url: '/crm/pipeline', method: 'GET' },
    { module: '9. Opportunities CSV Export', url: '/reports/export/opportunities', method: 'GET', expectCsv: true },
    { module: '10. Proposals Directory', url: '/proposals', method: 'GET' },
    { module: '11. Outreach Messages', url: '/outreach/messages', method: 'GET' },
    { module: '11. Outreach Suppression List', url: '/outreach/suppression', method: 'GET' },
    { module: '12. Reports Analytics', url: '/reports/analytics', method: 'GET' },
    { module: '12. Companies CSV Export', url: '/reports/export/companies', method: 'GET', expectCsv: true },
    { module: '13. Tasks & Follow-ups', url: '/crm/tasks', method: 'GET' },
    { module: '14. Data Sources', url: '/sources', method: 'GET' },
    { module: '15. Users Roster', url: '/users', method: 'GET' },
    { module: '15. Roles Definition', url: '/users/roles', method: 'GET' },
    { module: '16. System Settings', url: '/settings', method: 'GET' },
    { module: '16. Scoring Weights', url: '/qualification/weights', method: 'GET' },
    { module: '17. Audit Logs', url: '/audit?limit=10', method: 'GET' }
  ];

  let passCount = 0;
  let failCount = 0;

  for (const item of testList) {
    try {
      const opts = { method: item.method, headers };
      if (item.body) opts.body = JSON.stringify(item.body);

      const res = await fetch(`${baseUrl}${item.url}`, opts);
      if (res.ok) {
        passCount++;
        let detail = '';
        if (item.expectCsv) {
          const text = await res.text();
          detail = `(CSV length: ${text.length} bytes)`;
        } else {
          const data = await res.json();
          detail = Array.isArray(data) ? `(${data.length} records)` : (data.data ? `(${data.data.length} records)` : '(OK object)');
        }
        console.log(`[PASS] ${item.module.padEnd(30)} ${item.method} ${item.url} -> HTTP ${res.status} ${detail}`);
      } else {
        failCount++;
        const errText = await res.text();
        console.error(`[FAIL] ${item.module.padEnd(30)} ${item.method} ${item.url} -> HTTP ${res.status}: ${errText}`);
      }
    } catch (err) {
      failCount++;
      console.error(`[ERR ] ${item.module.padEnd(30)}: ${err.message}`);
    }
  }

  console.log(`\nEndpoint Audit Result: ${passCount} Passed, ${failCount} Failed.`);
  server.close();
  console.log('=== FULL ENDPOINT FUNCTIONALITY AUDIT END ===');
  process.exit(failCount > 0 ? 1 : 0);
}

auditAllEndpoints().catch(console.error);
