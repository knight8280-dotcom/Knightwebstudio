const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (const w of [360, 372, 375, 379, 380, 382, 384, 386, 388, 390, 392, 393, 394, 396, 398, 400, 402, 412, 414, 428, 430]) {
    await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(60);
    const r = await p.evaluate(() => ({
      menu: [...document.querySelectorAll('.menu a')].map(a => { const lh = parseFloat(getComputedStyle(a.querySelector('.menu-price')).lineHeight) || 24; const pr = a.querySelector('.menu-price').getClientRects().length; return Math.round(a.getBoundingClientRect().height) + (pr > 1 ? '!' : ''); }),
      rows: [...document.querySelectorAll('main summary')].map(a => Math.round(a.getBoundingClientRect().height) + (a.querySelector('.pl-price').getBoundingClientRect().height > 40 ? '!' : '')),
      strip: (() => { const n = document.querySelector('.price-strip-nums'), c = document.querySelector('.page-head .container'); const last = n.lastElementChild; const rg = document.createRange(); rg.selectNodeContents(last); return Math.round(rg.getBoundingClientRect().right - c.getBoundingClientRect().right); })(),
      H: document.documentElement.scrollHeight,
      tag: [...document.querySelectorAll('main .tag')].map(t => Math.round(t.getBoundingClientRect().height)),
      h1: Math.round(document.querySelector('h1').getBoundingClientRect().height),
    }));
    console.log(w, 'H', r.H, 'menu', r.menu.join(','), 'rows', r.rows.join(','), 'strip text past container by', r.strip, 'tags', r.tag.join(','), 'h1', r.h1);
  }
  await b.close();
})();
