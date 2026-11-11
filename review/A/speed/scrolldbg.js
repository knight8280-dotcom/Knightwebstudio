const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const opts of [{ channel: 'chromium' }, {}]) {
    const browser = await chromium.launch(opts);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await page.goto('http://localhost:8720/', { waitUntil: 'load' }); await page.waitForTimeout(800);
    const st = () => page.evaluate(() => ({ y: scrollY, top: document.scrollingElement.scrollTop, vv: visualViewport.pageTop, h: document.documentElement.scrollHeight, bodyOv: getComputedStyle(document.body).overflow, htmlOv: getComputedStyle(document.documentElement).overflow }));
    console.log(JSON.stringify(opts), 'before', JSON.stringify(await st()));
    for (const type of ['touch', 'mouse']) { await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 500, yDistance: -700, speed: 1400, gestureSourceType: type }); await page.waitForTimeout(300); console.log('  after', type, JSON.stringify(await st())); }
    await page.mouse.wheel(0, 700); await page.waitForTimeout(300); console.log('  after wheel', JSON.stringify(await st()));
    await browser.close();
  }
})();
