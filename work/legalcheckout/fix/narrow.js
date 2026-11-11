// Narrow screens and enlarged text: nothing inside the till may run past its container, and no text may be cut.
const { chromium } = require('playwright');
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const SID = 'cs_test_a1b2c3d4e5f6g7h8';
(async () => { const b = await chromium.launch(); let bad = 0;
  const cases = [['checkout blocked', '/checkout/?plan=commerce-care', null, false], ['checkout server down', '/checkout/?plan=commerce-care', null, true], ['checkout no plan', '/checkout/', null, true],
    ['success care paid', '/checkout/success/?plan=commerce-care&session_id=' + SID, { status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 100000, currency: 'usd', plan: 'commerce-care' }, false],
    ['success not completed', '/checkout/success/?plan=commerce-deposit&session_id=' + SID, { status: 'open', payment_status: 'unpaid', mode: 'payment', amount_total: 400000, currency: 'usd', plan: 'commerce-deposit' }, false]];
  for (const [name, url, body, stripe] of cases) for (const z of [1, 1.5, 2]) { const out = [];
    for (const w of [320, 340, 360, 380, 400, 600, 820, 980, 1000, 1120, 1280, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
      await ctx.route(/js\.stripe\.com/, r => stripe ? r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.Stripe=function(){return{initCheckoutFormSdk:function(o){return{createForm:function(){return{mount:function(){},on:function(){}}},loadActions:function(){return o.clientSecret.then(function(){return{type:"error"}})}}}}}' }) : r.abort());
      await ctx.route(/onrender\.com/, r => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors }) : body ? r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) }) : r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(500);
      if (z > 1) { await p.evaluate(z => { document.documentElement.style.fontSize = z * 100 + '%'; }, z); await p.waitForTimeout(80); }
      const m = await p.evaluate(() => { const c = document.querySelector('.till').getBoundingClientRect(); const bad = [];
        for (const e of document.querySelectorAll('.till *')) { if (!e.offsetParent || e.closest('svg')) continue; const r = e.getBoundingClientRect(); if (!r.width) continue;
          if (r.right > c.right + 1 || r.left < c.left - 1) bad.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ' +' + Math.round(Math.max(r.right - c.right, c.left - r.left)));
          else if (getComputedStyle(e).display !== 'inline' && e.scrollWidth > e.clientWidth + 1) bad.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ' text +' + (e.scrollWidth - e.clientWidth)); }
        return bad.slice(0, 4); });
      if (m.length) { bad++; out.push(w + ': ' + m.join(', ')); } await ctx.close(); }
    console.log(name.padEnd(22), 'text x' + z, out.length ? '\n    ' + out.join('\n    ') : 'clean at all 12 widths'); }
  await b.close(); console.log(bad ? bad + ' problem case(s)' : 'nothing past the container in any case'); })();
