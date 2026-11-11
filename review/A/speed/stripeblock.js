// /checkout/: Stripe's script is a plain <script src> in <head>. How long is the page blank if js.stripe.com is slow?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  for (const [name, base] of [['new', 'http://localhost:8720'], ['live', 'http://localhost:8700']]) for (const delay of [0, 3000]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/js\.stripe\.com/, async r => { await sleep(delay); r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.Stripe=function(){return{initEmbeddedCheckout:function(){return Promise.reject(new Error("test stub"))}}};' }); });
    const page = await ctx.newPage(); await page.goto(base + '/checkout/?plan=starter', { waitUntil: 'load' }); await sleep(300);
    const fcp = await page.evaluate(() => { const e = performance.getEntriesByName('first-contentful-paint')[0]; return e ? Math.round(e.startTime) : null; });
    console.log(`${name} /checkout/ with Stripe's script taking ${delay}ms: first paint at ${fcp}ms`);
    await ctx.close();
  }
  await browser.close();
})();
