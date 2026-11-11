const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const out = [];
  for (let w = 1100; w <= 1400; w += 20) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'networkidle' });
    const h = await p.evaluate(() => { const e = document.querySelector('.site-header .header-cta'); return e ? Math.round(e.getBoundingClientRect().height) : null; });
    const pop = await p.evaluate(() => { const e = document.querySelector('.spec .popular').getBoundingClientRect(); const t = document.querySelector('.spec .is-popular').getBoundingClientRect(); return [Math.round(e.left - t.left), Math.round(e.top - t.top)]; });
    const btn = await p.evaluate(() => [...document.querySelectorAll('.spec-act .btn')].map(e => Math.round(e.getBoundingClientRect().height)).join(','));
    out.push(`${w}: header button ${h}px; tab offset ${pop}; act ${btn}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
