const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    for (const rel of [true, false]) {
      await p.evaluate(r => document.querySelectorAll('.kws-spot-cap,.kws-arc-cap').forEach(c => c.style.position = r ? 'relative' : 'static'), rel);
      for (const [sel, name] of [['#work .is-on .kws-spot-kind', 'spotkicker'], ['#services .is-on .kws-arc-name', 'arcname']]) {
        const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
        await el.screenshot({ path: `s/px-${theme}-${name}-${rel ? 'rel' : 'static'}.png` });
      }
    }
    await ctx.close();
  }
  await b.close();
})();
