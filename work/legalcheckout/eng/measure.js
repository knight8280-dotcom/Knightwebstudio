const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
(async () => {
  const browser = await chromium.launch();
  // 1. characters per line in running text
  for (const path of ['/privacy/', '/terms/']) {
    const row = [];
    for (const w of [360, 390, 430, 600, 768, 820, 979, 980, 1024, 1100, 1280, 1440, 1920]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } }); await ctx.route(/plausible/, r => r.abort());
      const page = await ctx.newPage(); await page.goto(base + path); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
      const r = await page.evaluate(() => {
        const cpl = el => { const range = document.createRange(); range.selectNodeContents(el); const rects = [...range.getClientRects()]; const lines = new Set(rects.map(r => Math.round(r.top))).size; return lines > 1 ? Math.round(el.textContent.trim().length / lines) : null; };
        const ps = [...document.querySelectorAll('.prose > p:not(.label)')].map(cpl).filter(Boolean);
        const full = el => { // chars on the first full line
          const tn = el.firstChild; return null; };
        const lede = cpl(document.querySelector('.lede'));
        const prose = document.querySelector('.prose').getBoundingClientRect(); const toc = document.querySelector('.toc').getBoundingClientRect();
        const longest = Math.max(...[...document.querySelectorAll('.prose > p:not(.label)')].map(p => { const range = document.createRange(); let max = 0; const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let lineTop = null, count = 0; while (tw.nextNode()) { const n = tw.currentNode; for (let i = 0; i < n.length; i++) { range.setStart(n, i); range.setEnd(n, i + 1); const rc = range.getClientRects()[0]; if (!rc) continue; const t = Math.round(rc.top / 4); if (lineTop === null || Math.abs(t - lineTop) > 2) { max = Math.max(max, count); count = 0; lineTop = t; } count++; } } return Math.max(max, count); }));
        return { avg: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length), longest, lede, proseW: Math.round(prose.width), tocW: Math.round(toc.width), side: Math.abs(toc.top - prose.top) < 5 && toc.left < prose.left, cols: getComputedStyle(document.querySelector('.toc ol')).columnCount, lh: getComputedStyle(document.querySelector('.prose p:not(.label)')).lineHeight, fs: getComputedStyle(document.querySelector('.prose p:not(.label)')).fontSize };
      });
      row.push(w + ': avg ' + r.avg + ' max ' + r.longest + ' lede ' + r.lede + ' prose ' + r.proseW + 'px toc ' + r.tocW + 'px' + (r.side ? ' side' : ' above') + ' cols ' + r.cols);
      if (w === 390) row.push('   body ' + r.fs + '/' + r.lh);
      await ctx.close();
    }
    console.log(path + '\n  ' + row.join('\n  '));
  }
  await browser.close();
})();
