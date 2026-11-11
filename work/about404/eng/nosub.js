const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [820, 1100]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    const n = await p.evaluate(() => { const s = [...document.styleSheets].find(s => s.href && s.href.includes('about.css')); let n = 0; for (let i = s.cssRules.length - 1; i >= 0; i--) if (s.cssRules[i] instanceof CSSSupportsRule) { s.deleteRule(i); n++; } // also drop mask support? no
      document.querySelector('.notes').scrollIntoView(); scrollBy(0, -100); return n; });
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ ul1: Math.round(document.querySelector('.projects').getBoundingClientRect().top), ul2: Math.round(document.querySelector('.towns').getBoundingClientRect().top) }));
    console.log(w, 'supports rules removed:', n, 'list tops:', JSON.stringify(r));
    await p.screenshot({ path: __dirname + `/wshots/nosubgrid-${w}.png` }); await ctx.close(); }
  await b.close(); })();
