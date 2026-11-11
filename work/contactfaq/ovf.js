const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const sim of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    if (sim) await p.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); s.innerHTML = '<iframe style="width:303px;height:78px;border:0;display:block" title="sim"></iframe>'; });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('main *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > 360.5 && r.width > 0) out.push(e.tagName + '.' + (e.className || '').toString().slice(0, 30) + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width)); });
      return { innerW: innerWidth, scrollW: document.documentElement.scrollWidth, over: out.slice(0, 12) };
    });
    console.log('sim', sim, JSON.stringify(r, null, 1));
    await ctx.close();
  }
  await b.close();
})();
