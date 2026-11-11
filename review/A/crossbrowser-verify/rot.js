// does rotating the phone lose the scroll position? new site vs live, per engine
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE];
(async () => {
  const b = await eng.launch();
  for (const base of ['http://localhost:8720', 'http://localhost:8700']) for (const path of ['/contact/', '/pricing/']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1500); }); await p.waitForTimeout(500);
    const y0 = await p.evaluate(() => Math.round(scrollY));
    await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(700); const y1 = await p.evaluate(() => Math.round(scrollY));
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(700); const y2 = await p.evaluate(() => Math.round(scrollY));
    console.log(`  ${process.env.ENGINE} ${base.slice(-4)}${path}: scrollY ${y0} -> landscape ${y1} -> portrait ${y2}`);
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
