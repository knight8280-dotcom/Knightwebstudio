const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (const w of [360, 375, 390, 393, 412, 414, 430, 480, 540, 599]) {
    await p.setViewportSize({ width: w, height: 844 }); await p.waitForTimeout(80);
    const r = await p.evaluate(() => {
      const h1 = document.querySelector('h1'); const cs = getComputedStyle(h1); const fs = parseFloat(cs.fontSize);
      const c = document.createElement('canvas').getContext('2d'); c.font = `600 ${fs}px Fraunces`; c.letterSpacing = cs.letterSpacing;
      const m = t => Math.round(c.measureText(t).width);
      const range = document.createRange(); range.selectNodeContents(h1); const lines = []; let lastTop = -1;
      const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT); let cur = '';
      while (walker.nextNode()) { const n = walker.currentNode; for (let i = 0; i < n.textContent.length; i++) { range.setStart(n, i); range.setEnd(n, i + 1); const q = range.getClientRects()[0]; if (!q) continue; if (Math.abs(q.top - lastTop) > 5 && lastTop !== -1) { lines.push(cur.trim()); cur = ''; } lastTop = q.top; cur += n.textContent[i]; } }
      lines.push(cur.trim());
      return { fs: +fs.toFixed(1), avail: Math.round(h1.getBoundingClientRect().width), lines, widths: lines.map(m), greedy: { 'A website and the': m('A website and the'), 'systems that bring': m('systems that bring'), 'the systems that': m('the systems that'), 'bring in customers': m('bring in customers'), 'A website and the systems': m('A website and the systems') } };
    });
    console.log(w, JSON.stringify(r));
  }
  await b.close();
})();
