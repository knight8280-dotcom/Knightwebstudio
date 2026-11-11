const { launch } = require('./lib');
(async () => {
  const b = await launch();
  for (const [base, tag] of [['http://localhost:8700', 'baseline'], ['http://localhost:8720', 'new']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 1400 } });
    await ctx.route(/onrender\.com/, r => r.abort());
    const page = await ctx.newPage();
    await page.goto(base + '/checkout/?plan=starter-deposit', { waitUntil: 'load' });
    await page.waitForTimeout(12000);
    const m = await page.evaluate(() => { const f = document.getElementById('checkout-form'), s = document.getElementById('checkout-status'); const r = e => { const x = e.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top), Math.round(x.width), Math.round(x.height)]; };
      return { form: r(f), status: r(s), text: s.textContent, iframes: f.querySelectorAll('iframe').length, gap: Math.round(f.getBoundingClientRect().top - s.getBoundingClientRect().bottom), anim: [...f.querySelectorAll('*')].filter(e => getComputedStyle(e).animationName !== 'none').length }; });
    console.log(tag, JSON.stringify(m));
    await page.screenshot({ path: `shots/states/${tag}__co-serverdown__tall1280.png` });
    await ctx.close();
  }
  await b.close();
})();
