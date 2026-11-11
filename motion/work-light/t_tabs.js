const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/light/demo.html'); await p.waitForTimeout(800);
  for (const w of [360, 375, 390, 412, 430, 600, 759]) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(150);
    const r = await p.evaluate(() => [...document.querySelectorAll('#pricing [role=tab]')].map(t => {
      const cs = getComputedStyle(t), rg = document.createRange(); let worst = 0;
      const inner = t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      for (const n of t.childNodes) { rg.selectNodeContents(n); worst = Math.max(worst, rg.getBoundingClientRect().width); }
      return { fs: cs.fontSize, inner: +inner.toFixed(1), text: +worst.toFixed(1), spare: +(inner - worst).toFixed(1) };
    }));
    console.log(w, JSON.stringify(r.map(x => `${x.fs} text ${x.text} in ${x.inner} spare ${x.spare}`)));
  }
  await b.close();
})();
