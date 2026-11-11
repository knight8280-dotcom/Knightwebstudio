const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 340, 360, 375, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => [...document.querySelectorAll('main > .kws-close .kws-close-kicker')].map(k => { const r = document.createRange(); r.selectNodeContents(k); return k.textContent + ': ' + r.getClientRects().length + ' line(s), ' + Math.round(k.getBoundingClientRect().height) + 'px'; }));
    console.log(w, r.join(' | '), 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await p.close();
  }
  await b.close();
})();
