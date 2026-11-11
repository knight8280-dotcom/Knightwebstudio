// reduced motion + no-JS: is the hero thread fully visible right away, and are reveals visible?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const mode of ['reduce', 'nojs']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference', javaScriptEnabled: mode !== 'nojs' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const op = el => { let o = 1, n = el; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } return o; };
      return { thread: [...document.querySelectorAll('.hero-phone .thread > li')].map(op), phone: op(document.querySelector('.hero-phone')),
        hidden: [...document.querySelectorAll('main .reveal, main .seq')].filter(e => op(e) < .99).length, total: document.querySelectorAll('main .reveal, main .seq').length };
    });
    console.log(mode, JSON.stringify(r));
    await p.screenshot({ path: `r4/${mode}-hero.png` });
    await ctx.close();
  }
  await b.close();
})();
