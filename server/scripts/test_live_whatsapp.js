async function run() {
  console.log('--- Testing Live Discovery on https://global.nkbmanufacturing.com ---');

  // 1. Health check
  const healthRes = await fetch('https://global.nkbmanufacturing.com/api/health');
  console.log('Health:', await healthRes.json());

  // 2. Login to get token
  const loginRes = await fetch('https://global.nkbmanufacturing.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nkb-hunter.local',
      password: 'Admin@NKB2026!'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in as:', loginData.user?.email, 'Role:', loginData.user?.role);

  // 3. Search Decision Makers (People mode)
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
  console.log(`Found ${peopleData.data?.length} decision makers.`);
  const withWhatsApp = peopleData.data?.filter(p => p.whatsappNumber || p.whatsappUrl);
  console.log(`Decision makers with WhatsApp: ${withWhatsApp?.length}`);
  if (withWhatsApp && withWhatsApp.length > 0) {
    console.log('Sample with WhatsApp:', {
      name: withWhatsApp[0].fullName,
      title: withWhatsApp[0].jobTitle,
      company: withWhatsApp[0].companyName,
      whatsappNumber: withWhatsApp[0].whatsappNumber,
      whatsappUrl: withWhatsApp[0].whatsappUrl,
      instagramUrl: withWhatsApp[0].instagramUrl,
      facebookUrl: withWhatsApp[0].facebookUrl
    });
  }

  // 4. Save a decision maker
  const targetPerson = withWhatsApp[0];
  const saveRes = await fetch('https://global.nkbmanufacturing.com/api/discovery/save-person', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ person: targetPerson })
  });
  const saveData = await saveRes.json();
  console.log('Save person result:', {
    success: saveData.success,
    contactName: saveData.contact?.full_name,
    whatsappUrl: saveData.contact?.whatsapp_url,
    instagramUrl: saveData.contact?.instagram_url,
    facebookUrl: saveData.contact?.facebook_url,
    companyId: saveData.companyId
  });

  // 5. Inspect website channels
  if (saveData.companyId) {
    const inspectRes = await fetch(`https://global.nkbmanufacturing.com/api/companies/${saveData.companyId}/inspect-channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const inspectData = await inspectRes.json();
    console.log('Live inspect website channels result:', {
      success: inspectData.success,
      inspectionIsLive: inspectData.inspection?.isLive,
      inspectionWhatsApp: inspectData.inspection?.whatsappUrl,
      inspectionSocials: {
        instagram: inspectData.inspection?.instagramUrl,
        facebook: inspectData.inspection?.facebookUrl,
        linkedin: inspectData.inspection?.linkedinUrl
      }
    });
  }

  // 6. Test Company Search with channels
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
  console.log(`Company search returned ${compData.summary?.companies?.length} companies.`);
  const compWithWa = compData.summary?.companies?.filter(c => c.whatsapp_number || c.whatsapp_url);
  console.log(`Companies with WhatsApp channels: ${compWithWa?.length}`);
  if (compWithWa && compWithWa.length > 0) {
    console.log('Sample company channels:', {
      name: compWithWa[0].legal_name,
      whatsapp: compWithWa[0].whatsapp_number,
      whatsapp_url: compWithWa[0].whatsapp_url,
      instagram: compWithWa[0].instagram_url,
      facebook: compWithWa[0].facebook_url
    });
  }

  console.log('--- Live Verification Finished Successfully ---');
}

run().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
