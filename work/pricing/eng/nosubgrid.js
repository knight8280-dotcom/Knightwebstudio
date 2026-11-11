const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  for (const w of [1100, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.css(\?|$)/, async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace(/@supports \(grid-template-rows: subgrid\)/g, '@supports (grid-template-rows: nosuchvalue)'); r.fulfill({ response: resp, body }); });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const spec = document.querySelector('.spec'); const tr = [...spec.querySelectorAll('tbody tr')].map(t => { const r = t.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; });
      const lab = getComputedStyle(spec.querySelector('.cell-label')); const th = getComputedStyle(spec.querySelector('thead')); const pop = spec.querySelector('.popular').getBoundingClientRect(); const ptr = spec.querySelector('.is-popular').getBoundingClientRect(); const pnm = spec.querySelector('.is-popular .spec-name'); const rg = document.createRange(); rg.selectNode(pnm.firstChild); const nr = rg.getBoundingClientRect(); const pprice = spec.querySelector('.is-popular .spec-price'); const rg2 = document.createRange(); rg2.selectNode(pprice.firstChild); const prr = rg2.getBoundingClientRect();
      const one = spec.querySelector('tbody tr'); const nm1 = one.querySelector('.spec-name').getBoundingClientRect(), pr1 = one.querySelector('.spec-price').getBoundingClientRect();
      return { over: document.documentElement.scrollWidth - innerWidth, display: getComputedStyle(spec).display, rows: tr, cellLabel: lab.display, theadPos: th.position, popTop: Math.round(pop.top - ptr.top), popVsName: [Math.round(pop.bottom), Math.round(nr.top)], popRight: Math.round(pop.right), nameRight: Math.round(nr.right), priceLeft: Math.round(prr.left), firstCard: { nameTop: Math.round(nm1.top - one.getBoundingClientRect().top), priceTop: Math.round(pr1.top - one.getBoundingClientRect().top), nameAlign: getComputedStyle(one.querySelector('.spec-name')).justifyContent }, actPad: getComputedStyle(one.querySelector('.spec-act')).alignContent, btnFont: getComputedStyle(one.querySelector('.spec-act .btn')).fontSize, btnPad: getComputedStyle(one.querySelector('.spec-act .btn-block')).paddingLeft }; });
    console.log(w, JSON.stringify(r));
    const y = await p.evaluate(() => document.querySelector('#packages').getBoundingClientRect().top + scrollY - 10);
    await p.screenshot({ path: `shots/nosubgrid-${w}.png`, fullPage: true, clip: { x: 0, y, width: w, height: 1500 } });
    await ctx.close();
  }
  await b.close();
})();
