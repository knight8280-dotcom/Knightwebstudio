const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [980, 1100, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.waitForTimeout(1500);
    const s = () => p.evaluate(() => { const e = document.querySelector('.hero-phone'); const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { cls: e.className, op: cs.opacity, vis: cs.visibility, tr: cs.transform, anim: cs.animationName, box: [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)], mq: matchMedia('(min-width: 980px)').matches, iw: innerWidth }; });
    console.log(w, 'loaded', JSON.stringify(await s()));
    await p.evaluate(() => scrollTo(0, 4000)); await p.waitForTimeout(600); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(900);
    console.log(w, 'after scroll', JSON.stringify(await s()));
    await p.screenshot({ path: `dbg_${w}_view.png` });
    await p.screenshot({ path: `dbg_${w}_full.png`, fullPage: true, clip: { x: 0, y: 0, width: w, height: 900 } });
    console.log(w, 'after fullPage shot', JSON.stringify(await s()));
    await ctx.close();
  }
  await b.close();
})();
