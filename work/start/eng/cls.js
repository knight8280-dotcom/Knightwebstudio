const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 740 }, { width: 600, height: 900 }, { width: 604, height: 900 }, { width: 820, height: 1180 }, { width: 1100, height: 800 }, { width: 1440, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    // delay the fonts 1.5s so the fallback is painted first
    await ctx.route(/\.woff2/, async r => { await new Promise(x => setTimeout(x, 1500)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => s.node && s.node.nodeType === 1 ? s.node.tagName.toLowerCase() + '.' + (s.node.className && s.node.className.toString ? s.node.className.toString().split(' ')[0] : '') + ' ' + Math.round(s.previousRect.top) + '->' + Math.round(s.currentRect.top) + ' h' + Math.round(s.previousRect.height) + '->' + Math.round(s.currentRect.height) : '?') }); } } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(700);
    const before = await p.evaluate(() => { const q = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), Math.round(r.width)]; }; return { h1: q('h1'), lede: q('.lede'), row: q('.page-head .btn-row'), b1: q('.page-head .btn-row a:first-child'), b2: q('.page-head .btn-row a:last-child'), strip: q('.price-strip'), offer: q('#offer'), fonts: [...document.fonts].map(f => f.family + ':' + f.status).join(','), docH: document.documentElement.scrollHeight }; });
    await p.screenshot({ path: `work/start/eng/fallback-${vp.width}.png` });
    await p.waitForTimeout(2600); await p.evaluate(() => document.fonts.ready);
    const after = await p.evaluate(() => { const q = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), Math.round(r.width)]; }; return { h1: q('h1'), lede: q('.lede'), row: q('.page-head .btn-row'), b1: q('.page-head .btn-row a:first-child'), b2: q('.page-head .btn-row a:last-child'), strip: q('.price-strip'), offer: q('#offer'), fonts: [...document.fonts].map(f => f.family + ':' + f.status).join(','), docH: document.documentElement.scrollHeight, cls: +window.__cls.toFixed(4), shifts: window.__shifts }; });
    console.log(`\n${vp.width}x${vp.height}`); console.log(' fallback:', JSON.stringify(before)); console.log(' loaded:  ', JSON.stringify(after));
    await ctx.close();
  }
  await b.close();
})();
