// How many lines does each candidate lede take at phone widths?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const C = [
  'Websites, consulting and automation: what you see is what you pay, confirmed in writing before work begins.',
  'Websites, consulting and automation: what you see is what you pay, confirmed in writing first.',
  'What you see is what you pay, confirmed in writing before any work begins.',
  'Websites, consulting and automation. What you see is what you pay, confirmed in writing before we start.',
  'Websites, consulting and automation alike. What you see is what you pay, confirmed in writing before work begins.',
  'Every price here is fixed. What you see is what you pay, confirmed in writing before any work begins.',
  'Websites, consulting and automation: what you see is what you pay, confirmed in writing before we begin.',
];
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 414, 430, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(C => C.map(t => { const l = document.querySelector('.lede'); l.textContent = t; const cs = getComputedStyle(l); return Math.round(l.getBoundingClientRect().height / parseFloat(cs.lineHeight)); }), C);
    console.log(w, r.join(' '));
    await p.close();
  }
  await b.close();
})();
