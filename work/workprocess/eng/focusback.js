const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) for (const [w, h] of [[390, 844], [820, 1100], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
    await p.evaluate(() => { const l = [...document.querySelectorAll('.site-footer a')]; l[0].focus(); }); await p.waitForTimeout(300);
    const rows = [];
    for (let i = 0; i < 14; i++) {
      await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(450);
      const r = await p.evaluate(() => { const el = document.activeElement; if (!el.closest('main')) return null; const rc = el.getBoundingClientRect(); const hdr = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const shown = bar.classList.contains('show') && getComputedStyle(bar).display !== 'none'; const br = bar.getBoundingClientRect();
        const hidTop = Math.max(0, Math.min(rc.bottom, hdr.bottom) - rc.top), hidBot = shown ? Math.max(0, rc.bottom - Math.max(rc.top, br.top)) : 0;
        return { t: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24), top: Math.round(rc.top), bottom: Math.round(rc.bottom), h: Math.round(rc.height), underHeader: Math.round(hidTop), underBar: Math.round(hidBot), off: rc.top < 0 || rc.bottom > innerHeight }; });
      if (!r) { if (rows.length) break; else continue; } rows.push(r);
    }
    const bad = rows.filter(r => r.underHeader > 0 || r.underBar > 0 || r.off);
    console.log(path, w, 'shift-tab stops in main:', rows.length, bad.length ? 'OBSCURED: ' + JSON.stringify(bad) : 'none obscured');
    await ctx.close();
  }
  await b.close();
})();
