const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com/, r => r.abort());
  await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' }) }));
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/checkout/success/?plan=business-deposit&session_id=cs_test_abcdefghij1234567890', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  for (const w of [360, 375, 390, 393, 412, 430, 599]) {
    await p.setViewportSize({ width: w, height: 844 });
    const r = await p.evaluate(() => { const f = s => getComputedStyle(document.querySelector(s)).fontSize; return { h1: f('#success-title'), price: f('#success-plan-price'), stepNo: f('.steps-no'), stepH3: f('.steps h3'), lede: f('#success-sub') }; });
    console.log(w, JSON.stringify(r), 'h1@.76=', (parseFloat(r.h1) / .85 * .76).toFixed(1));
  }
  await b.close();
})();
