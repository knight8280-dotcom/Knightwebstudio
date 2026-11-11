const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 412, 430]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const s = document.querySelector('.bizcard-top span'); const c = document.querySelector('.bizcard'); return { tagLines: Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)), cardH: Math.round(c.offsetHeight) }; });
    console.log(w, JSON.stringify(r));
    if (w === 390 || w === 360) await (await p.$('.bizcard')).screenshot({ path: `${__dirname}/extra/card-${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
