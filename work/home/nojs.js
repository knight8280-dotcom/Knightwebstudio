// With JavaScript off: is everything readable? Lists anything invisible, and saves full-page shots.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: w < 700 });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'load' });
    await p.waitForTimeout(800);
    const bad = await p.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('main *')) {
        const cs = getComputedStyle(el);
        if (!el.getClientRects().length) continue;
        let o = 1, n = el; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
        if (o < 0.99 && !el.closest('.bubble-typing') && !el.closest('svg')) out.push(el.tagName + '.' + el.className + ' opacity ' + o);
        if (cs.visibility === 'hidden') out.push(el.tagName + '.' + el.className + ' hidden');
      }
      return { bad: [...new Set(out)].slice(0, 20), height: document.documentElement.scrollHeight, ovf: document.documentElement.scrollWidth - innerWidth,
               booking: [...document.querySelectorAll('[data-booking]')].map(a => a.getAttribute('href')) };
    });
    console.log(w, JSON.stringify(bad));
    await p.screenshot({ path: `c3/nojs-${w}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
