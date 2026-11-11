const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 844 } });
    await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const m = document.querySelector('body > footer .kws-foot-mark'), cs = getComputedStyle(m), sc = m.parentElement.getBoundingClientRect(), mb = m.getBoundingClientRect();
      const sv = document.querySelector('body > footer .kws-foot-skyline').getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(m); const tr = range.getBoundingClientRect();
      return { fontSize: cs.fontSize, padB: cs.paddingBottom, padT: cs.paddingTop, sceneH: sc.height, markH: mb.height, markTop: mb.top - sc.top, svgH: sv.height, svgTop: sv.top - sc.top, textTop: tr.top - sc.top, textBottom: tr.bottom - sc.top, textW: tr.width };
    });
    console.log(w, r);
    await p.close();
  }
  await b.close();
})();
