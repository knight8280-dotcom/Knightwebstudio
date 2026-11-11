const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [390, 664], [820, 1100], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const list = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map((e, i) => ({ i, cls: e.className.toString().replace('reveal', '').trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height), top: Math.round(e.getBoundingClientRect().top + scrollY) })));
    const tallest = list.filter(x => x.h > h * 0.9).map(x => `${x.cls} ${x.h}px`);
    console.log(`\n${w}x${h}: reveal blocks taller than 90% of the screen: ${tallest.join('; ') || 'none'}`);
    // For each reveal block: scroll so its top is N px above the bottom edge, find the smallest N at which it turns visible
    for (const x of list.filter(x => x.h > 500)) {
      let need = null;
      for (let n = 20; n <= 400; n += 20) { await p.evaluate(({ top, n, h }) => scrollTo({ top: top - h + n, behavior: 'instant' }), { top: x.top, n, h }); await p.waitForTimeout(140); const vis = await p.evaluate(i => document.querySelectorAll('.reveal')[i].classList.contains('visible'), x.i); if (vis) { need = n; break; } }
      console.log(`   ${x.cls} (${x.h}px tall): stays hidden until ${need === null ? 'more than 400' : need}px of it is on screen`);
    }
    await ctx.close();
  }
  await b.close();
})();
