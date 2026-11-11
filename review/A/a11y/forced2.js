const { chromium, BASE, slug, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [path, y] of [['/pricing/', 1500], ['/consulting/', 1700], ['/', 5200]]) for (const w of [390, 1280]) {
    const ctx = await ctxFor(b, { w, h: w === 390 ? 844 : 800, theme: 'dark', reduced: true, forced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(500);
    console.log(path, w, await p.evaluate(() => { const h = document.getElementById('site-header'); const cs = getComputedStyle(h); const m = document.getElementById('mobile-cta'); const cm = m ? getComputedStyle(m) : null; return { headerBg: cs.backgroundColor, headerClass: h.className, bf: cs.backdropFilter, headerBorderB: cs.borderBottomWidth + ' ' + cs.borderBottomColor, barBg: cm && cm.backgroundColor, barShown: m && m.className }; }));
    await p.screenshot({ path: `shots/forced/scrolled_${slug(path)}_${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
