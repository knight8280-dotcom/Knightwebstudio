// Measure candidate headline lines in the site's display face.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const lines = process.argv.slice(2);
  const out = await p.evaluate(async (lines) => {
    await document.fonts.ready;
    const h = document.querySelector('h1'); const res = [];
    for (const size of [38, 41.3, 52, 66.5, 75]) {
      for (const t of lines) {
        const s = document.createElement('span'); s.textContent = t; s.style.cssText = `position:absolute;white-space:nowrap;font-size:${size}px;letter-spacing:-.022em`;
        h.appendChild(s); res.push([size, t, Math.round(s.getBoundingClientRect().width)]); s.remove();
      }
    }
    return res;
  }, lines);
  for (const r of out) console.log(r.join(' | '));
  await b.close();
})();
