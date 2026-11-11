// Sweeps /about/ from 300 to 1920: sideways scroll, h1 word fit, tagline lines, list-top alignment, opening lines
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible|calendly|hcaptcha/, r => r.abort());
  const p = await ctx.newPage();
  const widths = process.argv.slice(2).map(Number);
  const W = widths.length ? widths : [300, 320, 340, 356, 360, 375, 379, 380, 390, 412, 430, 599, 600, 680, 759, 760, 820, 979, 980, 990, 1000, 1024, 1040, 1060, 1080, 1099, 1100, 1140, 1200, 1280, 1366, 1440, 1920];
  for (const w of W) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const q = s => document.querySelector(s); const R = e => e.getBoundingClientRect();
      const lines = e => { const rg = document.createRange(); rg.selectNodeContents(e); return new Set([...rg.getClientRects()].map(x => Math.round(x.top))).size; };
      const h1 = q('h1'); const last = [...h1.querySelectorAll('.l')].pop(); const rg = document.createRange(); rg.selectNodeContents(last);
      const col = R(q('.page-head-split > div'));
      const tag = q('.bizcard-top span'); const tagBox = R(q('.bizcard-top p'));
      const rgt = document.createRange(); rgt.selectNodeContents(tag); const tr = [...rgt.getClientRects()];
      const mark = R(q('.mark'));
      return { over: document.documentElement.scrollWidth - innerWidth, h1fs: parseFloat(getComputedStyle(h1).fontSize).toFixed(1), h1lines: lines(h1), wordSpare: Math.round(col.right - Math.max(...[...rg.getClientRects()].map(x => x.right))),
        card: Math.round(R(q('.bizcard')).width), tagLines: new Set(tr.map(x => Math.round(x.top))).size, tagSpare: Math.round(tagBox.right - Math.max(...tr.map(x => x.right))),
        openFs: parseFloat(getComputedStyle(q('.opening')).fontSize).toFixed(1), openLines: lines(q('.opening')), openW: Math.round(R(q('.opening')).width),
        listTops: [Math.round(R(q('.projects')).top + scrollY), Math.round(R(q('.towns')).top + scrollY)], h: document.documentElement.scrollHeight };
    });
    console.log(String(w).padStart(5), JSON.stringify(r));
  }
  await b.close();
})();
