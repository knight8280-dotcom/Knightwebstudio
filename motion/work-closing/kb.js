const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await p.focus('.kws-close a');
  for (let i = 0; i < 9; i++) {
    const r = await p.evaluate(() => { const el = document.activeElement, q = el.getBoundingClientRect(); return [el.textContent.trim().slice(0, 20), Math.round(q.top), Math.round(q.bottom), innerHeight, Math.round(scrollY), document.documentElement.scrollHeight]; });
    console.log(r.join('  '));
    await p.keyboard.press('Tab');
    await p.waitForTimeout(50);
  }
  await b.close();
})();
