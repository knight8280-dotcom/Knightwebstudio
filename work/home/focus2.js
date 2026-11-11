const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const url = process.argv[2] || 'http://localhost:8720/';
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  for (let i = 0; i < 60; i++) {
    await p.keyboard.press('Tab');
    await p.waitForTimeout(450);
    const info = await p.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect(); const bar = document.querySelector('.mobile-cta');
      const br = bar.getBoundingClientRect(); const shown = bar.classList.contains('show');
      return { t: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), barTop: shown ? Math.round(br.top) : null, inBar: bar.contains(el), inMain: !!el.closest('main') };
    });
    if (!info) break;
    if (info.inMain) console.log(JSON.stringify(info), info.barTop && info.bottom > info.barTop ? '<-- under bar by ' + (info.bottom - info.barTop) : '');
    if (info.t.startsWith('Send an enquiry')) break;
  }
  await b.close();
})();
