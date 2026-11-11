const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820, 1440, 1920]) {
    const out = [];
    for (const [name, url, sel] of [['today', 'http://localhost:8730/pricing/', ['.cta-band', '.site-footer', '.footer-skyline']], ['kit', 'http://localhost:8730/kit/closing/test/pricing-with-kit.html', ['.kws-close', '.kws-foot', '.kws-skyline']]]) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.route(/plausible\.io|calendly\.com|onrender\.com/, r => r.abort());
      await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(sel => sel.map(s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : 0; }).concat(document.documentElement.scrollHeight), sel);
      out.push(`${name}: band ${r[0]}, footer ${r[1]} (scene/skyline ${r[2]}), page ${r[3]}`);
      await p.close();
    }
    console.log(w + 'px  ' + out.join('   |   '));
  }
  await b.close();
})();
