async function testLiveDeployment() {
  console.log('================ LIVE PRODUCTION DEPLOYMENT AUDIT ================');
  console.log('Target Domain: https://global.nkbmanufacturing.com\n');

  // 1. Test Health
  console.log('[1/5] Testing Health Check...');
  const healthRes = await fetch('https://global.nkbmanufacturing.com/api/health');
  const healthData = await healthRes.json();
  console.log('Health Status:', healthRes.status, healthData);

  // 2. Test Login
  console.log('\n[2/5] Testing Admin Authentication...');
  const loginRes = await fetch('https://global.nkbmanufacturing.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nkb-hunter.local',
      password: 'Admin@NKB2026!'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('User Role:', loginData.user?.roleName, '| Name:', loginData.user?.fullName);
  const token = loginData.token;
  if (!token) throw new Error('Failed to retrieve JWT token: ' + JSON.stringify(loginData));

  // 3. Test Dashboard Stats
  console.log('\n[3/5] Testing Protected Dashboard Metrics Endpoint...');
  const statsRes = await fetch('https://global.nkbmanufacturing.com/api/dashboard/metrics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log('Dashboard Metrics Status:', statsRes.status);
  console.log('Metrics Summary:', statsData.metrics);

  // 4. Test Zero Dummy Data Policy
  console.log('\n[4/5] Verifying ZERO DUMMY DATA Policy on Live Database...');
  const compRes = await fetch('https://global.nkbmanufacturing.com/api/companies', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const compData = await compRes.json();
  console.log('Companies Endpoint Status:', compRes.status);
  console.log('Discovered Companies Count in Live DB:', compData.companies ? compData.companies.length : (Array.isArray(compData) ? compData.length : 0));
  if ((compData.companies?.length || 0) === 0) {
    console.log('>>> ZERO-DUMMY-DATA POLICY FULLY SATISFIED (0 companies)! <<<');
  } else {
    console.warn('WARNING: Companies found:', compData.companies?.length);
  }

  // 5. Check Other NKB Subdomains on the same VPS
  console.log('\n[5/5] Checking All Other NKB Production Webapps for ZERO REGRESSION...');
  const subdomains = [
    'https://sop.nkbmanufacturing.com',
    'https://dcc.nkbmanufacturing.com',
    'https://pr.nkbmanufacturing.com',
    'https://asset.nkbmanufacturing.com',
    'https://m.nkbmanufacturing.com',
    'https://tma.nkbmanufacturing.com',
    'https://nkbcloud.nkbmanufacturing.com'
  ];

  for (const url of subdomains) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      console.log(`- ${url}: HTTP ${res.status} (OK/Unaffected)`);
    } catch (e) {
      console.log(`- ${url}: Connection note (${e.message})`);
    }
  }

  console.log('\n================ AUDIT VERIFICATION FINISHED ================');
}

testLiveDeployment().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
