// Assorted measurements across widths: node probe.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 360, 390, 430, 600, 760, 820, 979, 980, 1024, 1099, 1100, 1180, 1229, 1240, 1280, 1366, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => {
      const q = s => document.querySelector(s), R = e => e.getBoundingClientRect();
      const lines = e => { const g = document.createRange(); g.selectNodeContents(e); const tops = new Set([...g.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4))); return tops.size; };
      const plans = [...document.querySelectorAll('.plans > li')].map(R);
      const sums = [...document.querySelectorAll('.ledger tbody td:nth-child(2)')].map(lines);
      const names = [...document.querySelectorAll('.ledger tbody th')].map(lines);
      const bar = R(q('.ledger-bar'));
      const link = R(q('.path .more-link'));
      const sheet = R(q('.sheet')), big = R(q('.bigfig'));
      const rec = R(q('#bundle .receipt')), panel = R(q('#bundle'));
      const calcIn = R(q('.calc-inputs')), calcRec = R(q('.calc .receipt'));
      const btn = q('.calc .receipt .btn');
      return {
        plansSide: plans.length === 2 && Math.abs(plans[0].top - plans[1].top) < 4,
        sums: Math.max(...sums), names: Math.max(...names), bar: Math.round(bar.width),
        link: Math.round(link.width) + 'x' + Math.round(link.height),
        week: Math.abs(sheet.top - big.top) < 80 ? 'side' : 'stack', sheet: Math.round(sheet.width),
        bundle: Math.abs(rec.left - panel.left) > panel.width / 3 ? 'side' : 'stack',
        calc: Math.abs(calcIn.top - calcRec.top) < 80 ? 'side' : 'stack', calcSticky: getComputedStyle(q('.calc .receipt')).position,
        btnLines: lines(btn), sw: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight,
      };
    });
    console.log(String(w).padStart(4), JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
