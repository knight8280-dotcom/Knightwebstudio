const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const fonts of [true, false]) for (const w of [320, 340, 360, 375, 390, 412, 600, 980, 1100]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); await ctx.route(/plausible|calendly/, r => r.abort());
    if (!fonts) await ctx.route('**/*.woff2', r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const l = [...document.querySelectorAll('h1 .l')].pop(); const rg = document.createRange(); rg.selectNodeContents(l); const rr = rg.getBoundingClientRect(); const c = document.querySelector('.page-head-split > div').getBoundingClientRect(); const h1 = document.querySelector('h1'); const aside = document.querySelector('.page-head-aside').getBoundingClientRect(); return { wordRight: Math.round(rr.right), wordW: Math.round(rr.width), colRight: Math.round(c.right), over: document.documentElement.scrollWidth - innerWidth, fs: getComputedStyle(h1).fontSize, h1Lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)), asideLeft: Math.round(aside.left), h1bottom: Math.round(h1.getBoundingClientRect().bottom) }; });
    console.log(fonts ? 'webfont ' : 'FALLBACK', w, JSON.stringify(r));
    await ctx.close(); }
  await b.close(); })();
