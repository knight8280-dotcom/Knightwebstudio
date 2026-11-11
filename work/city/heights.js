const { chromium } = require('playwright');
const towns = (process.argv[2] || 'baton-rouge,denham-springs,gonzales,prairieville').split(',');
const width = +(process.argv[3] || 390);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height: 844 }, isMobile: width < 700, hasTouch: width < 700, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  for (const t of towns) {
    await p.goto(`http://localhost:8720/web-design-${t}/`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const out = { page: document.documentElement.scrollHeight, main: Math.round(document.querySelector('main').getBoundingClientRect().height) };
      for (const s of document.querySelectorAll('main > section')) out[s.id || s.className.split(' ')[0]] = Math.round(s.getBoundingClientRect().height);
      const q = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height) : null; };
      out.parts = { h1: q('h1'), name: q('.city-name'), nameW: Math.round(document.querySelector('.city-name .mark').getBoundingClientRect().width), nameFs: getComputedStyle(document.querySelector('.city-name')).fontSize, prose: q('.prose'), meet: q('.city-meet'), steps: q('.steps'), board: q('.board'), boardHead: q('.board-head'), tiers: q('.board-tiers'), case: q('.case'), faq: q('.faq') };
      return out;
    });
    console.log(t, JSON.stringify(r));
  }
  await b.close();
})();
