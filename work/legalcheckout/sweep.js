/* Width sweep for the script-driven states: no sideways scroll and the slip's price inside the slip, 360 to 1920 in 20px steps. */
const { chromium } = require('playwright');
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const SID = 'cs_test_a1b2c3d4e5f6g7h8';
const cases = {
  'checkout care': ['/checkout/?plan=commerce-care', null],
  'success care paid': ['/checkout/success/?plan=commerce-care&session_id=' + SID, { status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 100000, currency: 'usd', plan: 'commerce-care' }],
  'success ach': ['/checkout/success/?plan=business-deposit&session_id=' + SID, { status: 'complete', payment_status: 'unpaid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' }],
  'checkout error': ['/checkout/', null],
};
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [name, [url, body]] of Object.entries(cases)) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await ctx.route(/js\.stripe\.com/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.Stripe=function(){return{initCheckoutFormSdk:function(){return{createForm:function(){return{mount:function(){},on:function(){}}},loadActions:function(){return new Promise(function(){})}}}}}' }));
    await ctx.route(/onrender\.com/, r => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors }) : body ? r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) }) : null);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(800);
    const out = [];
    for (let w = 360; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 900 });
      const m = await p.evaluate(() => { const d = document.documentElement; const pr = document.querySelector('.receipt-total b'); const h1 = document.querySelector('h1');
        return { over: d.scrollWidth - d.clientWidth, clip: pr && pr.offsetParent ? pr.getBoundingClientRect().width - pr.parentElement.getBoundingClientRect().width : -1,
                 h1lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) }; });
      if (m.over > 0 || m.clip > 0) { bad++; out.push(`${w}: overflow ${m.over} price over by ${Math.round(m.clip)}`); }
      if ([360, 390, 430, 600, 820, 980, 1100, 1280, 1440, 1920].includes(w)) out.push(`${w}: h1 ${m.h1lines} line(s), price slack ${Math.round(-m.clip)}`);
    }
    console.log(name + '\n  ' + out.join('\n  '));
    await ctx.close();
  }
  await b.close(); console.log(bad ? bad + ' problem(s)' : 'no overflow in any state at any width');
})();
