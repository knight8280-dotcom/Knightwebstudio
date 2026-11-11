// A returning visitor at the moment of the switch: new HTML, but styles.css and main.js still in the browser cache from the old site (GitHub Pages: max-age=600).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const B = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline';
(async () => {
  const browser = await chromium.launch();
  for (const [mode, css, js] of [['oldcss-oldjs', true, true], ['newcss-oldjs', false, true]]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (css) await ctx.route('**/assets/css/styles.css', r => r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(B + '/assets/css/styles.css') }));
    if (js) await ctx.route('**/assets/js/main.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(B + '/assets/js/main.js') }));
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    await page.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await page.waitForTimeout(1000);
    await page.screenshot({ path: `${__dirname}/shots/stale-${mode}-pricing-390-t1.png` });
    const a = await page.evaluate(() => ({ cls: document.documentElement.className, ready: window.kwsReady, navLinksInPage: [...document.querySelectorAll('#nav .nav-links a')].filter(x => x.getBoundingClientRect().height > 0).length, toggle: document.getElementById('nav-toggle').getBoundingClientRect().width }));
    await page.waitForTimeout(3600);
    const b = await page.evaluate(() => ({ cls: document.documentElement.className, navLinksInPage: [...document.querySelectorAll('#nav .nav-links a')].filter(x => x.getBoundingClientRect().height > 0 && getComputedStyle(document.getElementById('nav')).visibility !== 'hidden').length, toggle: document.getElementById('nav-toggle').getBoundingClientRect().width, hiddenReveals: [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity === '0').length }));
    await page.screenshot({ path: `${__dirname}/shots/stale-${mode}-pricing-390-t5.png` });
    console.log(mode, 't=1s', JSON.stringify(a), 't=4.6s', JSON.stringify(b), errs.length ? 'ERR ' + errs.join(' | ') : 'no script errors');
    await ctx.close();
  }
  await browser.close();
})();
