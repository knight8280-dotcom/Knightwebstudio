// Font swap: delay the two font files, compare the head before and after, and report layout shift.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 664 }, { width: 430, height: 740 }, { width: 600, height: 900 }, { width: 604, height: 900 }, { width: 820, height: 1180 }, { width: 980, height: 768 }, { width: 1100, height: 800 }, { width: 1440, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await new Promise(x => setTimeout(x, 1500)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(700);
    const snap = () => p.evaluate(() => { const q = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; }; const fam = getComputedStyle(document.querySelector('h1')).fontFamily; const lw = [...document.querySelectorAll('h1 .l')].map(l => { const rg = document.createRange(); rg.selectNodeContents(l); return Math.round(rg.getBoundingClientRect().width); }); const bt = [...document.querySelectorAll('.page-head .btn')].map(e => Math.round(e.getBoundingClientRect().width)); return { eyebrow: q('.page-head .eyebrow'), h1: q('h1'), lw, lede: q('.lede'), row: q('.page-head .btn-row'), bt, strip: q('.price-strip'), points: q('.points'), fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(',') }; });
    const before = await snap();
    if ([390, 600, 1440].includes(vp.width)) await p.screenshot({ path: `${__dirname}/fallback-${vp.width}.png` });
    await p.waitForTimeout(2600); await p.evaluate(() => document.fonts.ready);
    const after = await snap();
    console.log(`\n${vp.width}x${vp.height}  CLS ${(await p.evaluate(() => window.__cls)).toFixed(4)}`); console.log(' fallback:', JSON.stringify(before)); console.log(' loaded:  ', JSON.stringify(after));
    await ctx.close();
  }
  await b.close();
})();
