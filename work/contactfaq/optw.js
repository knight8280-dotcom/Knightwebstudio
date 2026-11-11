const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820, 1280, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const s = document.getElementById('package'); const cs = getComputedStyle(s);
      const c = document.createElement('canvas').getContext('2d'); c.font = `${cs.fontWeight} ${cs.fontSize} Figtree`;
      const avail = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return { avail: Math.round(avail), fs: cs.fontSize, opts: [...s.options].map(o => [o.text, Math.round(c.measureText(o.text).width)]).filter(x => x[1] > avail) };
    });
    console.log(w, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
