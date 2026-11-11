const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'networkidle' });
    console.log(w, await p.evaluate(() => {
      const li = document.querySelector('#payment .ticks li'); const cs = getComputedStyle(li);
      const intro = document.querySelector('#addons > p:not(.eyebrow)');
      return { tick: cs.fontSize, lh: cs.lineHeight, intro: getComputedStyle(intro).fontSize, w: li.getBoundingClientRect().width };
    }));
    await p.close();
  }
  await b.close();
})();
