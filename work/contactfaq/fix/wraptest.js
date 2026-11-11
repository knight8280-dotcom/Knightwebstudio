const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const mode of ['balance', 'pretty', 'wrap']) {
    for (const w of [360, 375, 390, 412, 430, 600, 700, 820, 980, 1024, 1100, 1280, 1440, 1920]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      await p.addStyleTag({ content: `[data-page="contact"] .steps p{text-wrap:${mode}}` });
      const r = await p.evaluate(() => [...document.querySelectorAll('.steps p, .lede, .case-facts dd:last-child')].map(el => { const range = document.createRange(); range.selectNodeContents(el); const rects = [...range.getClientRects()]; const lines = []; const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; const tops = new Map(); while ((n = walker.nextNode())) { for (let i = 0; i < n.length; i++) { const rr = document.createRange(); rr.setStart(n, i); rr.setEnd(n, i + 1); const c = rr.getClientRects()[0]; if (!c) continue; const k = Math.round(c.top); tops.set(k, (tops.get(k) || '') + n.data[i]); } } return [...tops.values()].map(s => s.trim()).join(' / '); }));
      console.log(mode, w, '\n   ' + r.join('\n   '));
      await ctx.close();
    }
  }
  await b.close();
})();
