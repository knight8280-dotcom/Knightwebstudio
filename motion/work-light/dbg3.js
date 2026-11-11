const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await ctx2.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p2 = await ctx2.newPage(); await p2.goto('http://localhost:8730/kit/light/demo.html'); await p2.waitForTimeout(1500);
  const cdp = await ctx2.newCDPSession(p2);
  const swipe = async (x, y, dy) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dy * i / 12 }] }); await p2.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p2.waitForTimeout(700);
  };
  let y0 = await p2.evaluate(() => scrollY);
  await swipe(195, 600, -300);
  console.log('manual touch swipe scrolled', (await p2.evaluate(() => scrollY)) - y0);
  await b.close();
})();
