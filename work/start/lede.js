const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 412, 430]) {
    const p = await b.newPage({ viewport: { width: w, height: 844 } });
    await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.waitForTimeout(300);
    const out = await p.evaluate((variants) => {
      const el = document.querySelector(process_sel = '.lede'); const r = [];
      for (const v of variants) { el.innerHTML = v; r.push(Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))); }
      return r;
    }, process.argv.slice(2));
    console.log(w, out.join(' '));
    await p.close();
  }
  await b.close();
})();
