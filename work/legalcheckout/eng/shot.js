// node shot.js name url width height theme [full] [clipY clipH]
const { chromium } = require('playwright');
(async () => {
  const jobs = JSON.parse(process.argv[2]);
  const b = await chromium.launch();
  for (const j of jobs) {
    const ctx = await b.newContext({ viewport: { width: j.w, height: j.h || 900 }, colorScheme: j.theme || 'light', isMobile: j.w < 700, hasTouch: j.w < 700, reducedMotion: j.rm || 'no-preference', javaScriptEnabled: j.nojs ? false : true, deviceScaleFactor: j.dpr || 1 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, j.theme || 'light');
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push('PAGEERROR ' + e));
    await p.goto(j.url, { waitUntil: 'load' });
    await p.waitForTimeout(j.wait || 700);
    if (j.scroll != null) { await p.evaluate(y => scrollTo(0, y), j.scroll); await p.waitForTimeout(400); }
    if (j.eval) await p.evaluate(j.eval);
    await p.screenshot({ path: 'shots/' + j.name + '.png', fullPage: !!j.full });
    console.log(j.name, 'errors:', errs.length ? errs.join(' | ') : 'none');
    await ctx.close();
  }
  await b.close();
})();
