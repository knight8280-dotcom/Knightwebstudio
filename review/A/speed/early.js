// Controls tapped before main.js has loaded (main.js held back 3s).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  await ctx.route('**/assets/js/main.js', async r => { await sleep(3000); r.continue(); });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8720/', { waitUntil: 'commit' }); await sleep(900);
  const st = () => page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), navOpen: document.getElementById('nav').classList.contains('open'), ready: !!window.kwsReady, booking: document.querySelector('[data-booking]').getAttribute('href'), cta: document.getElementById('mobile-cta').hidden }));
  console.log('t=0.9s            ', JSON.stringify(await st()));
  await page.tap('#theme-toggle'); await page.tap('#nav-toggle'); await sleep(200);
  console.log('after early taps  ', JSON.stringify(await st()));
  await sleep(3200);
  console.log('after main.js     ', JSON.stringify(await st()));
  await page.tap('#theme-toggle'); await page.tap('#nav-toggle'); await sleep(300);
  console.log('after late taps   ', JSON.stringify(await st()));
  await browser.close();
})();
