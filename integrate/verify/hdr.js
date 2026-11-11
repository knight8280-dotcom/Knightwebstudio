// The standard header between 300 and 360px wide: one row or two? Frozen copy against the repository.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [n, base] of [['prefold', 'http://localhost:8722'], ['repo', 'http://localhost:8720']]) {
    const ctx = await b.newContext({ viewport: { width: 320, height: 640 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    for (const path of ['/pricing/', '/start/', '/404.html']) {
      await p.goto(base + path);
      const two = [];
      let clipped = [];
      for (let w = 300; w <= 400; w += 2) {
        await p.setViewportSize({ width: w, height: 640 });
        await p.waitForTimeout(40);
        const r = await p.evaluate(() => {
          const hi = document.querySelector('.header-inner').getBoundingClientRect();
          const last = [...document.querySelectorAll('.header-inner *')].filter(e => e.getBoundingClientRect().width).reduce((m, e) => Math.max(m, e.getBoundingClientRect().right), 0);
          return { h: Math.round(hi.height), right: Math.round(last), w: innerWidth };
        });
        if (r.h > 66) two.push(w);
        if (r.right > r.w) clipped.push(w);
      }
      console.log(n, path, 'two rows at:', two.length ? two[0] + '-' + two[two.length - 1] : 'never', '| past the right edge at:', clipped.length ? clipped[0] + '-' + clipped[clipped.length - 1] : 'never');
    }
    await ctx.close();
  }
  await b.close();
})();
