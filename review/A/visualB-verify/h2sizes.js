const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1024, height: 800 } })).newPage();
  for (const c of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    await p.goto(`http://localhost:8720/web-design-${c}/`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    for (const w of [1024, 1100, 1280]) {
      await p.setViewportSize({ width: w, height: 800 });
      const r = await p.evaluate(() => [...document.querySelectorAll('main h2')].map(h => `${h.textContent.trim().slice(0, 34)} | ${getComputedStyle(h).fontSize} | w=${Math.round(h.getBoundingClientRect().width)} | lines=${Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight))}`));
      console.log(`-- ${c} @${w}\n   ` + r.join('\n   '));
    }
  }
  await b.close();
})();
