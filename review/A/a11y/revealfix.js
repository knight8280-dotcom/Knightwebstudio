// Proposed fix: observe with threshold 0 and a percentage bottom margin instead of an 8% ratio threshold. Re-run the slow scroll at the failing sizes.
const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[341, 162], [320, 170], [320, 256], [390, 844], [1280, 800]]) for (const path of ['/pricing/', '/consulting/', '/about/', '/']) {
    const ctx = await ctxFor(b, { w, h }); await ctx.addInitScript(() => { const IO = window.IntersectionObserver; window.IntersectionObserver = function (cb, o) { if (o && o.threshold === 0.08) o = { threshold: 0, rootMargin: '0px 0px -12% 0px' }; return new IO(cb, o); }; window.IntersectionObserver.prototype = IO.prototype; });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    const first = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => e.getBoundingClientRect().top > innerHeight).every(e => !e.classList.contains('visible')));
    const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y <= H; y += Math.max(40, Math.round(h * 0.25))) { await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(30); } await p.waitForTimeout(800);
    const left = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && +getComputedStyle(e).opacity < 0.99).length);
    console.log(`${w}x${h} ${path}: with fix, never-shown=${left}; blocks below the fold still wait for scroll=${first}`); await ctx.close(); }
  await b.close(); })();
