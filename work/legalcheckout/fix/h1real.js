const { chromium } = require('playwright');
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const SID = 'cs_test_a1b2c3d4e5f6g7h8';
const S = { paid: { status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 100000, currency: 'usd', plan: 'starter-deposit' }, ach: { status: 'complete', payment_status: 'unpaid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' }, unpaid: { status: 'open', payment_status: 'unpaid', mode: 'payment', amount_total: 400000, currency: 'usd', plan: 'commerce-deposit' } };
(async () => { const b = await chromium.launch();
  for (const [name, body] of Object.entries(S)) { const out = [];
    for (const w of [360, 390, 600, 700, 820, 960, 1024, 1440]) { const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); await ctx.route(/plausible|calendly/, r => r.abort());
      await ctx.route(/onrender\.com/, r => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors }) : r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) }));
      const p = await ctx.newPage(); await p.goto('http://localhost:8720/checkout/success/?plan=' + body.plan + '&session_id=' + SID); await p.waitForTimeout(500);
      out.push(w + ': ' + await p.evaluate(() => { const h = document.getElementById('success-title'), t = h.textContent, r = document.createRange(), n = h.firstChild; const lines = []; let last = null, cur = '';
        for (let i = 0; i < t.length; i++) { r.setStart(n, i); r.setEnd(n, i + 1); const y = Math.round(r.getBoundingClientRect().top); if (last !== null && Math.abs(y - last) > 5 && t[i] !== ' ') { lines.push(cur.trim()); cur = ''; } if (t[i] !== ' ') last = y; cur += t[i]; } lines.push(cur.trim());
        const slip = document.getElementById('success-plan'); return lines.join(' / ') + '  [slip ' + (slip.offsetParent ? 'shown' : 'hidden') + ', buttons ' + [...document.querySelectorAll('.btn-row .btn')].filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().width)).join('+') + ']'; })); await ctx.close(); }
    console.log(name + '\n  ' + out.join('\n  ')); }
  await b.close(); })();
