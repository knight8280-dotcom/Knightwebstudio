// CLS with fonts delayed 1.5s, Georgia/Arial stand-ins installed: as shipped vs. with the Georgia fallback at size-adjust 109.6%.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  for (const fix of [false, true]) for (const [p, vw, vh] of [['/pricing/', 390, 844], ['/pricing/', 360, 740], ['/pricing/', 430, 932], ['/', 390, 844], ['/terms/', 1280, 800], ['/services/', 768, 1024], ['/404.html', 360, 740], ['/start/', 390, 844], ['/consulting/', 390, 844], ['/contact/', 390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500, deviceScaleFactor: 2 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await sleep(1500); r.continue(); });
    if (fix) await ctx.route('**/assets/css/styles.css', r => { let css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'); const from = 'src: local("Georgia"), local("Noto Serif"); size-adjust: 101%; ascent-override: 97%; descent-override: 25%;'; if (!css.includes(from)) throw new Error('rule not found'); r.fulfill({ status: 200, contentType: 'text/css', body: css.replace(from, 'src: local("Georgia"); size-adjust: 109.6%; ascent-override: 89%; descent-override: 23%;') }); });
    await ctx.addInitScript(() => { window.__ls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__ls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'domcontentloaded' }); await sleep(4500);
    console.log((fix ? 'with fix ' : 'as shipped') + ' ' + (p + '@' + vw).padEnd(20) + ' CLS ' + (await page.evaluate(() => window.__ls)).toFixed(4));
    await ctx.close();
  }
  await browser.close();
})();
