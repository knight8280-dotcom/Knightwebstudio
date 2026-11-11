// Text-only scaling (root font size raised) at phone widths, desktop-mode viewport so innerWidth stays put.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, scale] of [[390, 1], [390, 1.1], [390, 1.25], [390, 1.5], [360, 1.5], [390, 2], [320, 1]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.addStyleTag({ content: `html { font-size: ${scale * 100}% }` }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const out = {}; for (const el of document.querySelectorAll('main *')) { if (el.closest('svg, .sr-only')) continue; const rc = el.getBoundingClientRect(); if (!rc.width) continue; const d = Math.round(rc.right - document.documentElement.clientWidth); if (d > 0) { const k = el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]; out[k] = Math.max(out[k] || 0, d); } } return out; });
    console.log(`text at ${Math.round(scale * 100)}% on ${w}px:`, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
