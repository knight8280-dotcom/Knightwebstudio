const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.screenshot({ path: `shots/nojs-${w}-top.png` });
    // evaluate still works with JS disabled in Playwright (runs in isolated world)
    const r = await p.evaluate(() => { const vis = e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && e.getBoundingClientRect().width > 0; };
      const invisible = [...document.querySelectorAll('main *')].filter(e => { if (e.closest('svg,.sr-only,thead')) return false; const cs = getComputedStyle(e); return (+cs.opacity < 1 || cs.visibility === 'hidden') && cs.display !== 'none'; }).map(e => (e.className || e.tagName).toString().slice(0, 40));
      return { htmlClass: document.documentElement.className, theme: document.documentElement.getAttribute('data-theme'), invisible: [...new Set(invisible)], themeToggle: vis(document.getElementById('theme-toggle')), navToggle: document.getElementById('nav-toggle') ? vis(document.getElementById('nav-toggle')) : null, navLinksVisible: [...document.querySelectorAll('#nav a')].filter(vis).length, mobileCta: document.getElementById('mobile-cta') ? vis(document.getElementById('mobile-cta')) : null,
        booking: [...document.querySelectorAll('main [data-booking]')].map(a => a.getAttribute('href')), wideOnlySeal: vis(document.querySelector('.toc-seal')), H: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, year: (document.getElementById('year') || {}).textContent, headerTel: vis(document.querySelector('.header-tel')) }; });
    console.log(w, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
