const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const mobile of [true, false]) for (const w of [360, 375, 380, 390, 393, 400, 412, 430]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1 });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-gonzales/'); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const n = document.querySelector('.price-strip-nums'), s = document.querySelector('.price-strip'); const wrap = getComputedStyle(n).flexWrap; n.style.flexWrap = 'nowrap'; const natural = n.scrollWidth; const nw = n.getBoundingClientRect().width; n.style.flexWrap = ''; return { strip: s.getBoundingClientRect().width, numsNoWrap: +nw.toFixed(1), natural, withRule: wrap, rows: new Set([...n.children].map(c => Math.round(c.getBoundingClientRect().top))).size }; });
    console.log(mobile ? 'mobile ' : 'desktop', w, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
