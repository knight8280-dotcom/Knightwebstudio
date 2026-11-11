// Element screenshots: node sec.js WIDTH THEME NAME SELECTOR [SELECTOR...]   (THEME light|dark)
const { chromium } = require('playwright');
(async () => {
  const [w, theme, name, ...sels] = process.argv.slice(2);
  const W = +w;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: W < 700 ? 844 : 900 }, isMobile: W < 700, hasTouch: W < 700, colorScheme: theme, reducedMotion: 'reduce', deviceScaleFactor: W < 700 ? 2 : 1 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(500);
  await p.addStyleTag({ content: '#mobile-cta, .site-header { display: none !important; }' });
  let i = 0;
  for (const sel of sels) {
    const els = await p.$$(sel);
    for (const el of els) { i++; await el.screenshot({ path: __dirname + '/sec/' + name + '-' + W + '-' + theme + '-' + String(i).padStart(2, '0') + '.png' }); }
  }
  console.log('wrote', i);
  await b.close();
})();
