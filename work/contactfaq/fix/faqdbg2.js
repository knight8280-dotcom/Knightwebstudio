const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const mob of [true, false]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/faq/', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const s = document.querySelectorAll('summary')[1]; const cs = getComputedStyle(s); return { w: s.getBoundingClientRect().width, h: s.getBoundingClientRect().height, font: cs.fontFamily, fs: cs.fontSize, loaded: [...document.fonts].map(f => f.family + ':' + f.status), iw: innerWidth, cw: document.documentElement.clientWidth, tw: cs.textWrap }; });
  console.log(mob, JSON.stringify(r));
  await p.screenshot({ path: `${__dirname}/faqdbg-${mob}.png` });
  await ctx.close();
  }
  await b.close();
})();
