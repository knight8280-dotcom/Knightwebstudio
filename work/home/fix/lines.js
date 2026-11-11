// prints how a block's text is broken into lines at several widths:  node lines.js "selector" 360,390,...
const { chromium } = require('playwright');
const sels = process.argv[2].split('|'); const widths = (process.argv[3] || '360,375,390,412,430,600,760,820,980,1024,1100,1280,1366,1440,1920').split(',').map(Number);
(async () => {
  const b = await chromium.launch();
  for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.evaluate(() => document.fonts.ready);
    for (const sel of sels) {
      const r = await p.evaluate(sel => [...document.querySelectorAll(sel)].map(el => {
        const lines = []; let last = null; const range = document.createRange();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) { const n = walker.currentNode; if (n.parentElement.closest('.sr-only')) continue; const cs = getComputedStyle(n.parentElement); if (cs.display === 'none') continue;
          for (const m of n.textContent.matchAll(/\S+/g)) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const rc = range.getClientRects()[0]; if (!rc) continue; const y = Math.round(rc.top);
            if (last === null || Math.abs(y - last) > 6) { lines.push(m[0]); last = y; } else lines[lines.length - 1] += ' ' + m[0]; } }
        return lines.join(' / ');
      }), sel);
      r.forEach(t => console.log(w, sel, '::', t));
    }
    await ctx.close();
  }
  await b.close();
})();
