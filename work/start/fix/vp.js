// Viewport screenshots: node vp.js name WxH[:scheme][@scrollSelector] ...
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const spec of process.argv.slice(2)) {
    const [size, sel] = spec.split('@'); const [wh, scheme = 'light'] = size.split(':'); const [w, h] = wh.split('x').map(Number);
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: w < 700 ? 2 : 1, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    if (sel) { await p.evaluate(s => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, sel); await p.waitForTimeout(900); }
    const name = `${__dirname}/vp-${w}x${h}-${scheme}${sel ? '-' + sel.replace(/[^a-z]/gi, '') : ''}.png`;
    await p.screenshot({ path: name }); console.log(name);
    await ctx.close();
  }
  await b.close();
})();
