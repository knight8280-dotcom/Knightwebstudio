const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 664], [360, 600], [1280, 800], [1440, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => { const q = s => Math.round(document.querySelector(s).getBoundingClientRect().bottom); return { button: q('.page-head .btn-primary'), firstPrices: q('.toc li .toc-price'), h1: document.querySelectorAll('h1').length, spec: Math.round(document.querySelector('.spec').getBoundingClientRect().top) }; });
    console.log(`${w}x${h}`, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
