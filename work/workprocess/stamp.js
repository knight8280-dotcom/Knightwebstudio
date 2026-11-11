const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm }); const p = await c.newPage();
    await p.goto('http://localhost:8720/process/', { waitUntil: 'load' }); await p.waitForTimeout(600);
    const st = () => p.evaluate(() => { const e = document.querySelector('.stamp'); const cs = getComputedStyle(e); return { cls: e.className, op: cs.opacity, tf: cs.transform, rot: cs.rotate }; });
    console.log(rm, 'before', JSON.stringify(await st()));
    await p.evaluate(() => document.querySelector('.stamp').scrollIntoView({ block: 'center' }));
    for (const t of [60, 120, 200, 400, 900]) { await p.waitForTimeout(t === 60 ? 60 : 100); console.log(rm, 'after', JSON.stringify(await st())); }
    await c.close(); }
  await b.close(); })();
