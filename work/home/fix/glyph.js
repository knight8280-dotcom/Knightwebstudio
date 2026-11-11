const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 360, height: 700 } });
  await p.goto('http://localhost:8720/'); await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => {
    const w = (ff, ch) => { const s = document.createElement('span'); s.style.cssText = `position:absolute;font:400 100px ${ff};white-space:nowrap`; s.textContent = ch.repeat(10); document.body.appendChild(s); const x = s.getBoundingClientRect().width; s.remove(); return Math.round(x); };
    const out = {};
    for (const [name, ch] of [['nb-hyphen', '‑'], ['hyphen', '-'], ['wj', 'a⁠-⁠b']]) out[name] = { fig_mono: w('"Figtree", monospace', ch), fig_serif: w('"Figtree", serif', ch), mono: w('monospace', ch) };
    // widths of the small-row names
    const names = [...document.querySelectorAll('.print h3')].map(h => { const r = document.createRange(); r.selectNodeContents(h); return [h.textContent, Math.round(r.getBoundingClientRect().width), Math.round(h.getBoundingClientRect().width)]; });
    const kinds = [...document.querySelectorAll('.print-kind')].map(h => { const r = document.createRange(); r.selectNodeContents(h); return [h.textContent, Math.round(r.getBoundingClientRect().width), Math.round(h.getBoundingClientRect().width)]; });
    return { out, names, kinds };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
