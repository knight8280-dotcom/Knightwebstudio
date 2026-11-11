const { launch } = require('./lib');
(async () => {
  const b = await launch(); const ctx = await b.newContext();
  for (const u of ['https://web3forms.com', 'https://smilyssoftwash.com', 'https://risenhealthco.com', 'https://corbelbooks.com']) {
    const p = await ctx.newPage();
    try { const r = await p.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(2500); console.log(r.status(), p.url(), '| title:', JSON.stringify(await p.title())); }
    catch (e) { console.log('ERR', u, String(e).slice(0, 200)); }
    await p.close();
  }
  await b.close();
})();
