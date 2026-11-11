const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [path, w, h] of [['/contact/', 390, 664], ['/contact/', 1280, 720], ['/faq/', 390, 664]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERROR ' + e));
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const out = [];
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(650);
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const t = e.matches('.chip input') ? e.nextElementSibling : e; const r = t.getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const br = bar && getComputedStyle(bar).visibility !== 'hidden' && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight; return { name: (e.id || e.innerText || '').trim().slice(0, 22), inMain: !!e.closest('main'), footer: !!e.closest('footer'), top: Math.round(r.top), bottom: Math.round(r.bottom), hdBottom: Math.round(hd.bottom), limit: Math.round(br) }; });
      if (!s || s.footer) break; if (s.inMain) out.push(s);
    }
    const hiddenStops = out.filter(s => s.top < s.hdBottom - 1 || s.bottom > s.limit + 1);
    console.log(path, w + 'x' + h, 'main stops', out.length, 'covered or out of view:', JSON.stringify(hiddenStops));
    console.log('  console errors:', JSON.stringify(errs));
    if (path === '/contact/' && w === 390) { await p.focus('#submit-btn'); await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/final/focus-send-390.png' }); await p.focus('#package'); await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/final/focus-package-390.png' }); }
    await ctx.close();
  }
  await b.close();
})();
