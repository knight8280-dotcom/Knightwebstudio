const { chromium } = require('playwright');
const cands = [
  "We build your website and set up Google reviews, missed-call text-back, online booking and automatic follow-up.",
  "We build your website, then set up Google reviews, missed-call text-back, online booking and automatic follow-up.",
  "We build fast websites and set up Google reviews, missed-call text-back, online booking and automatic follow-up.",
  "We build your website, then set up what keeps it working: Google reviews, missed-call text-back, online booking and follow-up.",
  "We build your website, then the systems behind it: Google reviews, missed-call text-back, online booking and follow-up.",
];
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 412, 430, 820, 1280, 1366, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.evaluate(() => document.fonts.ready);
    const out = [];
    for (const c of cands) {
      const n = await p.evaluate(c => { const el = document.querySelector('.hero .lede'); el.textContent = c; const lh = parseFloat(getComputedStyle(el).lineHeight); return Math.round(el.getBoundingClientRect().height / lh); }, c);
      out.push(n);
    }
    console.log(w, out.join(' '));
    await ctx.close();
  }
  cands.forEach((c, i) => console.log(i, c.length, c));
  await b.close();
})();
