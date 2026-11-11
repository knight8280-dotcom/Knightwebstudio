const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  for (const [p, vw, vh, name] of [['/pricing/', 390, 844, 'pricing390'], ['/', 390, 844, 'home390'], ['/terms/', 1280, 800, 'terms1280'], ['/start/', 390, 844, 'start390']]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500, deviceScaleFactor: 1 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await sleep(1500); r.continue(); });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720' + p, { waitUntil: 'domcontentloaded' });
    const cdp = await ctx.newCDPSession(page); const snap = async f => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }); require('fs').writeFileSync(f, Buffer.from(data, 'base64')); };
    await sleep(1000); await snap(`${__dirname}/shots/swap-${name}-1-fallback.png`);
    await sleep(2200); await snap(`${__dirname}/shots/swap-${name}-2-loaded.png`);
    await ctx.close();
  }
  await browser.close();
})();
