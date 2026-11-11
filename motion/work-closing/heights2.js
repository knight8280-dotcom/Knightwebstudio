const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.route(/plausible\.io|calendly\.com|onrender\.com/, r => r.abort());
    await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const h = s => Math.round(document.querySelector(s).getBoundingClientRect().height); const all = [...document.querySelectorAll('main > .kws-close')].map(e => Math.round(e.getBoundingClientRect().height));
      return { strip: all[0], card: all[1], statement: all[2], slimStart: h('.demo-frame .kws-foot--slim'), footer: h('body > footer'), scene: h('body > footer .kws-skyline') }; });
    console.log(w + 'px', JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
