const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const st = p => p.evaluate(() => { const s = document.querySelector('footer .kws-skyline-sky'); const a = s.getAnimations({ subtree: true }).filter(x => x.animationName === 'kws-skyline-glow'); const c = getComputedStyle(s, '::after'); return { n: a.length, state: a[0] && a[0].playState, op: (+c.opacity).toFixed(2), x: new DOMMatrix(c.transform).m41.toFixed(1), btn: !!document.querySelector('.kws-motion:not([hidden])') }; });
  for (const [url, o] of [['test/pricing-with-kit.html', {}], ['test/notfound-with-kit.html', {}], ['test/pricing-with-kit.html', { reducedMotion: 'reduce' }], ['test/pricing-with-kit.html', { javaScriptEnabled: false }]]) {
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, o));
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/closing/' + url, { waitUntil: 'networkidle' });
    if (o.javaScriptEnabled !== false) await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
    await p.waitForTimeout(600);
    const a = o.javaScriptEnabled === false ? { n: 'n/a (script off)' } : await st(p);
    let extra = '';
    if (url.includes('pricing') && !o.reducedMotion && o.javaScriptEnabled !== false) {
      await p.waitForTimeout(4000); const mid = await st(p);
      await p.screenshot({ path: 'glow-a.png', clip: { x: 0, y: 650, width: 1440, height: 250 } });
      await p.waitForTimeout(4000); const mid2 = await st(p);
      await p.screenshot({ path: 'glow-b.png', clip: { x: 0, y: 650, width: 1440, height: 250 } });
      await p.click('footer .kws-motion'); await p.waitForTimeout(300); const off = await st(p);
      await p.screenshot({ path: 'glow-off.png', clip: { x: 0, y: 650, width: 1440, height: 250 } });
      await p.click('footer .kws-motion'); await p.waitForTimeout(300); const on = await st(p);
      extra = ` | +4s ${JSON.stringify(mid)} | +8s ${JSON.stringify(mid2)} | paused ${JSON.stringify(off)} | play again ${JSON.stringify(on)}`;
    }
    console.log(url, JSON.stringify(o), JSON.stringify(a) + extra);
    await ctx.close();
  }
  await b.close();
})();
