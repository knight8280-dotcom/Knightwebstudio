// OB-02: does ticking a chip move the others?
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE];
(async () => {
  const b = await eng.launch();
  for (const w of [360, 390, 430, 820, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, hasTouch: w < 900 });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const snap = () => p.evaluate(() => { const o = {}; document.querySelectorAll('.chip').forEach(c => { const r = c.getBoundingClientRect(); o[c.textContent.trim()] = [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width)]; }); o._fieldset = Math.round(document.querySelector('fieldset.field').getBoundingClientRect().height); return o; });
    const before = await snap();
    const names = Object.keys(before).filter(k => k[0] !== '_');
    let worst = null; const moves = [];
    for (const n of names) {
      const loc = p.locator('.chip', { hasText: n }).first();
      await loc.locator('input').check({ force: true });
      const after = await snap();
      const moved = names.filter(k => k !== n && (after[k][0] !== before[k][0] || after[k][1] !== before[k][1]));
      moves.push(`${n}: +${after[n][2] - before[n][2]}px wide, moves ${moved.length} others, fieldset ${before._fieldset}->${after._fieldset}`);
      await loc.locator('input').uncheck({ force: true });
    }
    console.log(process.env.ENGINE, w); moves.forEach(m => console.log('   ', m));
    if (w === 390 && process.env.SHOT) {
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset.field').scrollIntoView({ block: 'center' }); });
      await p.screenshot({ path: `shots/chips_${process.env.ENGINE}_before.png` });
      await p.locator('.chip', { hasText: 'E-commerce' }).locator('input').check({ force: true });
      await p.screenshot({ path: `shots/chips_${process.env.ENGINE}_after.png` });
    }
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
