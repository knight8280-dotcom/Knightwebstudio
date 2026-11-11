// The bare page with its small reset taken out: do the kit's parts still hold (no base layer assumed)?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.route('**/portable.html', async r => { const res = await r.fetch(); let t = await res.text(); t = t.replace('*, *::before, *::after { box-sizing: border-box; }', '').replace('h1, h2, p, ul, dl, dd { margin: 0; }', ''); await r.fulfill({ response: res, body: t }); });
    await p.goto('http://localhost:8730/kit/closing/portable.html', { waitUntil: 'load' });
    const r = await p.evaluate(() => { const H = s => Math.round(document.querySelector(s).getBoundingClientRect().height); const bad = [...document.querySelectorAll('.kws-close *, .kws-foot *')].filter(e => !e.closest('.kws-skyline') && e.getBoundingClientRect().right > innerWidth + 1).length;
      return { over: document.documentElement.scrollWidth - innerWidth, bad, band: H('.kws-close'), card: H('.kws-appt'), foot: H('.kws-foot'), boxSizing: getComputedStyle(document.querySelector('.kws-close-in')).boxSizing }; });
    console.log(w, JSON.stringify(r));
    if (w !== 360) await p.screenshot({ path: `noreset-${w}.png`, fullPage: true });
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto('http://localhost:8730/kit/closing/portable.html', { waitUntil: 'load' });
  console.log('with reset 390', JSON.stringify(await p.evaluate(() => { const H = s => Math.round(document.querySelector(s).getBoundingClientRect().height); return { band: H('.kws-close'), card: H('.kws-appt'), foot: H('.kws-foot') }; })));
  await b.close();
})();
