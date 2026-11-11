// Measures: page height per width, menu rows (height, lines), board position, row summaries, header CTA height.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8720/services/';
(async () => {
  const b = await chromium.launch();
  const widths = (process.argv[2] || '360,380,384,390,414,430,600,760,820,980,1024,1100,1180,1260,1280,1366,1440,1920').split(',').map(Number);
  for (const w of widths) {
    const h = w < 700 ? 844 : (w === 1280 ? 800 : (w === 1366 ? 768 : 900));
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(350);
    const r = await p.evaluate(() => {
      const q = s => document.querySelector(s), R = e => e.getBoundingClientRect();
      const rows = [...document.querySelectorAll('.menu a')].map(a => Math.round(R(a).height));
      const sums = [...document.querySelectorAll('.faq-item summary')].map(a => Math.round(R(a).height));
      const board = R(q('.menu'));
      const firstRow = R(q('.menu a'));
      const cta = q('.site-header .header-cta');
      const fig = q('.fig'); const fr = R(fig);
      const lab = q('.phone-label');
      return { H: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, boardTop: Math.round(board.top + scrollY), boardH: Math.round(board.height), firstRowTop: Math.round(firstRow.top + scrollY), rows: rows.join(' '), sums: sums.join(' '),
        cta: cta ? Math.round(R(cta).height) : 0, figH: Math.round(fr.height), labelH: Math.round(R(lab).height), careH: Math.round(R(q('#care h3')).height), keepH: Math.round(R(q('#keep')).height) };
    });
    console.log(w + 'x' + h, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
