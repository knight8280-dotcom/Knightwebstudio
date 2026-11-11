// Where do the head's button and the first price row end on a phone's first screen?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 640], [375, 553], [375, 667], [390, 664], [414, 715], [430, 739]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    if (process.argv[2]) await p.addStyleTag({ content: process.argv[2] });
    const r = await p.evaluate(() => {
      const bot = s => Math.round(document.querySelector(s).getBoundingClientRect().bottom);
      const l = document.querySelector('.lede'), h1 = document.querySelector('h1');
      return { h1lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)), ledeLines: Math.round(l.getBoundingClientRect().height / parseFloat(getComputedStyle(l).lineHeight)), button: bot('.page-head .btn'), price1: bot('.toc li:first-child .toc-price'), row1: bot('.toc li:first-child a'), firstCardTop: Math.round(document.querySelector('.spec tbody tr').getBoundingClientRect().top) };
    });
    console.log(w + 'x' + h, JSON.stringify(r), r.price1 <= h ? 'price on first screen' : 'PRICE BELOW by ' + (r.price1 - h));
    await p.close();
  }
  await b.close();
})();
