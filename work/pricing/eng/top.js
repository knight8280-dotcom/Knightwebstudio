const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, theme] of [[980, 760, 'light'], [1280, 800, 'light'], [980, 760, 'dark'], [1920, 1080, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: `shots/top-${w}-${theme}.png` });
    console.log(w, theme, JSON.stringify(await p.evaluate(() => { const s = document.querySelector('.toc-seal svg').getBoundingClientRect(); const hd = document.querySelector('.site-header').getBoundingClientRect(); const c = document.querySelector('.toc.card').getBoundingClientRect(); const btn = document.querySelector('.page-head .btn').getBoundingClientRect(); return { sealTop: Math.round(s.top), sealRight: Math.round(s.right), sealW: Math.round(s.width), headerBottom: Math.round(hd.bottom), cardTop: Math.round(c.top), cardRight: Math.round(c.right), cardBottom: Math.round(c.bottom), vw: innerWidth, btnBottom: Math.round(btn.bottom), h2Top: Math.round(document.querySelector('#packages h2').getBoundingClientRect().top) }; })));
    await ctx.close();
  }
  await b.close();
})();
