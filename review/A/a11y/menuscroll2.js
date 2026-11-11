const { chromium, BASE, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/pricing/', '/', '/faq/', '/consulting/']) for (const y of [1500, 3000]) {
    const ctx = await ctxFor(b, { w: 390, h: 844, reduced: true, mobile: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(400);
    const r = await p.evaluate(async () => { const out = []; const snap = l => out.push(l + ': y=' + Math.round(scrollY) + ' docH=' + document.documentElement.scrollHeight);
      const wait = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      snap('start'); document.body.style.overflow = 'hidden'; await wait(); snap('body overflow hidden'); document.body.style.overflow = ''; await wait(); snap('overflow restored');
      document.querySelector('main').inert = true; await wait(); snap('main inert'); document.querySelector('main').inert = false; await wait(); snap('main not inert');
      document.getElementById('nav').classList.add('open'); await wait(); snap('nav open class'); document.getElementById('nav').classList.remove('open'); await wait(); snap('nav class removed');
      return out; });
    console.log(path, y, r.join(' | '));
    await ctx.close();
  }
  await b.close();
})();
