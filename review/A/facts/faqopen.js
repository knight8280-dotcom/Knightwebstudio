const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: rm });
    await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
    await p.goto('http://localhost:8720/faq/', { waitUntil: 'load' });
    const n = await p.locator('details.faq-item summary').count();
    let bad = 0;
    for (let i = 0; i < n; i++) {
      const s = p.locator('details.faq-item summary').nth(i);
      await s.scrollIntoViewIfNeeded(); await s.click(); await p.waitForTimeout(700);
      const o = await p.locator('details.faq-item').nth(i).evaluate(d => { const bdy = d.querySelector('.faq-body'); return [d.open, getComputedStyle(bdy).opacity, bdy.getBoundingClientRect().height > 10]; });
      if (!(o[0] && o[1] === '1' && o[2])) { bad++; console.log(rm, 'item', i, o); }
    }
    console.log(rm, 'items', n, 'not readable after opening:', bad);
    await p.close();
  }
  await b.close();
})();
