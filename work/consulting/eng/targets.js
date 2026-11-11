const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(400);
    const r = await p.evaluate(() => [...document.querySelectorAll('main a, main button, main summary, main input, main select, main textarea, #mobile-cta a, .site-header a, .site-header button, .topbar a')].filter(el => { const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); return rc.width && rc.height && cs.visibility !== 'hidden' && !el.closest('.nav:not(.open)'); }).map(el => { const rc = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { t: (el.textContent || el.id || '').trim().replace(/\s+/g, ' ').slice(0, 30) || el.id || el.getAttribute('aria-label'), w: Math.round(rc.width), h: Math.round(rc.height), inline: cs.display === 'inline' }; }));
    console.log(`\n== ${w}: ${r.length} targets; smallest heights:`); r.sort((a, c) => a.h - c.h).slice(0, 12).forEach(x => console.log(`  ${x.w}x${x.h} ${x.inline ? '(inline) ' : ''}${x.t}`));
    await ctx.close();
  }
  await b.close();
})();
