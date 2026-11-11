// The header on an emulated 320px phone (overlay scrollbars, DPR 2), frozen copy against the repository.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [n, base] of [['prefold', 'http://localhost:8722'], ['repo', 'http://localhost:8720']]) {
    for (const w of [320, 330, 332, 334, 336, 340, 360]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage();
      await p.goto(base + '/');
      await p.waitForTimeout(250);
      const r = await p.evaluate(() => {
        const hi = document.querySelector('.header-inner').getBoundingClientRect();
        const a = document.querySelector('.header-actions').getBoundingClientRect();
        return { clientW: document.documentElement.clientWidth, innerW: innerWidth, headerH: Math.round(hi.height), actionsLeft: Math.round(a.left), actionsRight: Math.round(a.right), actionsTop: Math.round(a.top - hi.top) };
      });
      console.log(n, w, JSON.stringify(r));
      if (w === 320) await p.screenshot({ path: __dirname + '/crops/phone320-' + n + '.png', clip: { x: 0, y: 0, width: 320, height: 200 } });
      await ctx.close();
    }
  }
  await b.close();
})();
