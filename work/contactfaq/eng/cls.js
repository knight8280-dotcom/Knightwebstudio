const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const [w, h] of [[390, 844], [1440, 900], [2560, 1440]]) for (const mode of ['fast', 'slow-fonts+late-js', 'captcha-late']) {
    if (mode === 'captcha-late' && path !== '/contact/') continue;
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/hcaptcha\.com/, async r => { if (mode !== 'captcha-late') return r.abort(); await new Promise(z => setTimeout(z, 800)); r.fulfill({ status: 200, contentType: 'application/javascript', body: `(function(){var s=document.getElementById('hcaptcha-slot');var f=document.createElement('iframe');f.style.cssText='width:303px;height:78px;border:0';s.appendChild(f);})();` }); });
    if (mode === 'slow-fonts+late-js') { await ctx.route(/\.woff2/, async r => { await new Promise(z => setTimeout(z, 900)); r.continue(); }); await ctx.route(/main\.js/, async r => { await new Promise(z => setTimeout(z, 1500)); r.continue(); }); }
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map(s => s.node && (s.node.nodeName + '.' + (s.node.className || '').toString().slice(0, 30))).slice(0, 3) }); } } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(3200);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts }));
    console.log(path, w + 'x' + h, mode, 'CLS', r.cls, r.shifts.length ? JSON.stringify(r.shifts) : '');
    await ctx.close();
  }
  await b.close();
})();
