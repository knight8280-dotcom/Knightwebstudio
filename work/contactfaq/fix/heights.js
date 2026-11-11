const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 430]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    let p = await ctx.newPage(); await p.goto(base + '/contact/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const h0 = await p.evaluate(() => document.documentElement.scrollHeight);
    const btn0 = await p.evaluate(() => Math.round(document.getElementById('submit-btn').getBoundingClientRect().top + scrollY));
    // simulate the 303x78 widget
    await p.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); const f = document.createElement('iframe'); f.style.cssText = 'width:303px;height:78px;border:0;background:#fafafa;display:inline-block'; s.appendChild(f); });
    await p.waitForTimeout(200);
    const h1 = await p.evaluate(() => document.documentElement.scrollHeight);
    const btn1 = await p.evaluate(() => Math.round(document.getElementById('submit-btn').getBoundingClientRect().top + scrollY));
    const parts = await p.evaluate(() => { const q = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; }; return { topbar: q('.topbar'), header: q('.site-header'), head: q('.page-head'), section: q('#contact'), ticket: q('.ticket'), side: q('.contact-side'), footer: q('.site-footer') }; });
    console.log('contact', w, 'height no widget', h0, 'with widget', h1, 'send moved', btn1 - btn0, JSON.stringify(parts));
    await p.close();
    p = await ctx.newPage(); await p.goto(base + '/faq/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const served = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = false)); await p.waitForTimeout(100);
    const closed = await p.evaluate(() => document.documentElement.scrollHeight);
    const fparts = await p.evaluate(() => { const q = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; }; return { head: q('.page-head'), section: q('#faq'), toc: q('.toc'), groups: q('.faq-groups'), cta: q('.cta-band'), footer: q('.site-footer') }; });
    console.log('faq', w, 'served', served, 'closed', closed, JSON.stringify(fparts));
    await ctx.close();
  }
  await b.close();
})();
