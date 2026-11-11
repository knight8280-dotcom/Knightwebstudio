// Text blocks whose last line is short: node orphans.js [width] [maxChars]
const { chromium } = require('playwright');
(async () => {
  const w = +(process.argv[2] || 390), maxc = +(process.argv[3] || 14);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(400);
  const r = await p.evaluate((maxc) => {
    const out = [];
    const els = [...document.querySelectorAll('main p, main li, main h2, main h3, main h4, main label, main summary, main a.btn')].filter(e => !e.querySelector('p, li, ul, ol, div, h3, h4') && e.offsetParent);
    for (const e of els) {
      const range = document.createRange(); range.selectNodeContents(e);
      const rects = [...range.getClientRects()].filter(r => r.width > 1);
      if (!rects.length) continue;
      const lines = [];
      for (const rc of rects) { const l = lines.find(l => Math.abs(l.top - rc.top) < 6); if (l) { l.left = Math.min(l.left, rc.left); l.right = Math.max(l.right, rc.right); } else lines.push({ top: rc.top, left: rc.left, right: rc.right }); }
      lines.sort((a, b) => a.top - b.top);
      if (lines.length < 2) continue;
      const last = lines[lines.length - 1], widest = Math.max(...lines.map(l => l.right - l.left));
      const fs = parseFloat(getComputedStyle(e).fontSize);
      const lastChars = (last.right - last.left) / (fs * 0.5);
      if (lastChars <= maxc) out.push([lines.length, Math.round(last.right - last.left), Math.round(widest), e.textContent.trim().replace(/\s+/g, ' ').slice(0, 90)]);
    }
    return out;
  }, maxc);
  for (const x of r) console.log(String(x[0]).padStart(2), 'lines; last', String(x[1]).padStart(3), 'of', String(x[2]).padStart(3), '|', x[3]);
  await b.close();
})();
