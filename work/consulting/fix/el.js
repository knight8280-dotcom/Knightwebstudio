// Element screenshots: node el.js WIDTH THEME NAME SELECTOR [SELECTOR...]   (THEME light|dark)  -> sec/NAME-WIDTH-THEME-NN.png
// Optional env: H=viewport height, PAD=extra px around each element (clip), FONT=root font size in px (text enlargement)
const { chromium } = require('playwright');
(async () => {
  const [w, theme, name, ...sels] = process.argv.slice(2);
  const W = +w;
  const pad = +(process.env.PAD || 0);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: +(process.env.H || (W < 700 ? 844 : 900)) }, isMobile: W < 700, hasTouch: W < 700, colorScheme: theme, reducedMotion: 'reduce', deviceScaleFactor: W < 700 ? 2 : 1 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(500);
  await p.addStyleTag({ content: '#mobile-cta, .site-header { display: none !important; }' + (process.env.FONT ? 'html { font-size: ' + process.env.FONT + 'px; }' : '') });
  await p.waitForTimeout(200);
  let i = 0;
  for (const sel of sels) {
    const els = await p.$$(sel);
    for (const el of els) {
      i++;
      const path = __dirname + '/sec/' + name + '-' + W + '-' + theme + '-' + String(i).padStart(2, '0') + '.png';
      if (!pad) { await el.screenshot({ path }); continue; }
      await el.scrollIntoViewIfNeeded();
      const bb = await el.boundingBox();
      const full = await p.evaluate(() => ({ x: scrollX, y: scrollY }));
      await p.screenshot({ path, fullPage: true, clip: { x: Math.max(0, bb.x + full.x - pad), y: Math.max(0, bb.y + full.y - pad), width: Math.min(W, bb.width + 2 * pad), height: bb.height + 2 * pad } });
    }
  }
  console.log('wrote', i);
  await b.close();
})();
