const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const [w, h] of [[375, 667], [1280, 620]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(300);
    // go to the end, focus last main focusable, then shift-tab back up
    await p.evaluate(() => { const els = [...document.querySelectorAll('main a, main button, main input:not([type=hidden]):not([tabindex="-1"]), main select, main textarea, main summary')].filter(e => e.offsetParent); els[els.length - 1].focus(); });
    const bad = []; let n = 0;
    for (let i = 0; i < 40; i++) { await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(80); const f = await p.evaluate(() => { const a = document.activeElement; if (!a.closest('main')) return null; const r = a.getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const barTop = bar && getComputedStyle(bar).display !== 'none' && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight; return { t: (a.id || a.textContent.trim().slice(0, 20) || a.value), top: Math.round(r.top), bottom: Math.round(r.bottom), hb: Math.round(hd.bottom), barTop: Math.round(barTop), vh: innerHeight }; }); if (!f) break; n++; if (f.top < f.hb - 1 || f.bottom > f.barTop + 1) bad.push(f); }
    console.log(path, w + 'x' + h, n, 'stops back up;', bad.length ? 'OBSCURED: ' + JSON.stringify(bad) : 'none obscured');
    await ctx.close(); }
  await b.close();
})();
