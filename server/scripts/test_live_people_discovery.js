async function testLivePeopleSearch() {
  console.log('Testing live HTTPS decision maker discovery on https://global.nkbmanufacturing.com...');

  // 1. Login
  const loginRes = await fetch('https://global.nkbmanufacturing.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nkb-hunter.local', password: 'Admin@NKB2026!' })
  });
  const { token } = await loginRes.json();
  console.log('Admin login success. Token acquired.');

  // 2. Test People / Decision Maker Hunter
  console.log('\n--- Searching for Decision Makers (Philippines / Cosmetics / Purchasing & Founders) ---');
  const peopleRes = await fetch('https://global.nkbmanufacturing.com/api/discovery/people', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      country: 'Philippines',
      industry: 'Cosmetics',
      role: 'All'
    })
  });
  const peopleData = await peopleRes.json();
  console.log(`Found ${peopleData.count} live decision makers:`);
  peopleData.data.slice(0, 5).forEach((p, idx) => {
    console.log(`[#${idx + 1}] Person: ${p.fullName} | Role: ${p.jobTitle} | Company: ${p.companyName} | Web: ${p.officialWebsite}`);
  });

  // 3. Test Commercial Brand Discovery (High-Quality Filtered)
  console.log('\n--- Searching for Commercial Companies (Philippines / Cosmetics) ---');
  const compRes = await fetch('https://global.nkbmanufacturing.com/api/discovery/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      country: 'Philippines',
      industry: 'Cosmetics',
      limit: 5
    })
  });
  const compData = await compRes.json();
  console.log('Companies search success:', compData.message);
  console.log('Sample discovered commercial brands:');
  compData.summary?.companies?.slice(0, 5).forEach((c, idx) => {
    console.log(`- ${c.legal_name} | Web: ${c.official_website} | Synergy: ${c.nkb_service_fit}`);
  });
}

testLivePeopleSearch().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
