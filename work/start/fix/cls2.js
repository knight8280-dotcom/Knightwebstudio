// Which nodes move when the fonts arrive, and which platform fonts the fallback really uses here.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 360, height: 640 }, { width: 1100, height: 800 }]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await new Promise(x => setTimeout(x, 1500)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__s = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__s.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 5).map(s => { const n = s.node; return n && n.nodeType === 1 ? n.tagName.toLowerCase() + '.' + String(n.className).split(' ')[0] + ' ' + Math.round(s.previousRect.top) + '>' + Math.round(s.currentRect.top) + ' h' + Math.round(s.previousRect.height) + '>' + Math.round(s.currentRect.height) : '?'; }) }); }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(URL, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(700);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    for (const sel of ['h1', '.lede', '.page-head .eyebrow', '.page-head .btn']) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
      const f = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      const w = await p.evaluate(s => { const e = document.querySelector(s); const rg = document.createRange(); rg.selectNodeContents(e); return [...new Set([...rg.getClientRects()].map(r => Math.round(r.width)))].join('/'); }, sel);
      console.log(vp.width, sel, 'fallback fonts:', f.fonts.map(x => x.familyName + (x.isCustomFont ? '(web)' : '')).join(','), 'widths', w);
    }
    await p.waitForTimeout(2600); await p.evaluate(() => document.fonts.ready);
    for (const sel of ['.lede', '.page-head .eyebrow']) console.log(vp.width, sel, 'loaded widths', await p.evaluate(s => { const e = document.querySelector(s); const rg = document.createRange(); rg.selectNodeContents(e); return [...new Set([...rg.getClientRects()].map(r => Math.round(r.width)))].join('/'); }, sel));
    console.log(JSON.stringify(await p.evaluate(() => window.__s), null, 1).slice(0, 2500));
    await ctx.close();
  }
  await b.close();
})();
