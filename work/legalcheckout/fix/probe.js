// Probes for the fix pass: scripts-off routes, narrow widths, text zoom, long prices, loading reserve.
const { chromium } = require('playwright');
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const SID = 'cs_test_a1b2c3d4e5f6g7h8';
const stub = mode => `window.Stripe=function(){return{initCheckoutFormSdk:function(o){var t;return{createForm:function(){return{mount:function(s){t=s},on:function(){}}},loadActions:function(){return new Promise(function(res,rej){if(${JSON.stringify(mode)}==='loading')return;o.clientSecret.then(function(){document.querySelector(t).innerHTML='<div style="height:520px;background:#fff"></div>';res({type:'success',actions:{confirm:function(){}}})},rej)})}}}}}`;
async function ctxFor(b, o) {
  const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, javaScriptEnabled: !o.nojs });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  await ctx.route(/js\.stripe\.com/, r => o.stripe ? r.fulfill({ status: 200, contentType: 'text/javascript', body: stub(o.stripe) }) : r.abort());
  await ctx.route(/onrender\.com/, r => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: cors }) : o.server === 'hang' ? null : o.server ? r.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(o.server) }) : r.abort());
  return ctx;
}
const spill = () => { const d = document.documentElement, c = document.querySelector('main .container').getBoundingClientRect(); const bad = [];
  for (const e of document.querySelectorAll('main *')) { if (!e.offsetParent) continue; const r = e.getBoundingClientRect(); if (r.width && (r.right > c.right + 1 || r.left < c.left - 1)) bad.push(e.tagName + '.' + e.className + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); }
  // text wider than its box
  for (const e of document.querySelectorAll('main p, main h1, main h2, main h3, main b, main a, main li')) { if (e.offsetParent && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline') bad.push('SCROLLW ' + e.tagName + '.' + e.className + ' ' + e.scrollWidth + '>' + e.clientWidth); }
  return { over: d.scrollWidth - d.clientWidth, cont: Math.round(c.left) + '-' + Math.round(c.right), bad: bad.slice(0, 8) }; };
(async () => {
  const b = await chromium.launch();
  // 1. scripts off
  { const ctx = await ctxFor(b, { nojs: true }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/checkout/?plan=starter-deposit');
    console.log('nojs:', await p.evaluate(() => ({ scriptingNone: matchMedia('(scripting: none)').matches, statusDisplay: getComputedStyle(document.getElementById('checkout-status')).display,
      noscriptP: !!document.querySelector('noscript > p'), sheetH: Math.round(document.querySelector('.till-pay').getBoundingClientRect().height) }))); await ctx.close(); }
  // 2. loading reserve, then error collapse, then mounted
  for (const [name, o] of [['loading', { stripe: 'loading', server: 'hang' }], ['blocked', {}], ['noplan', { stripe: 'loaded', url: '/checkout/' }], ['serverdown', { stripe: 'loaded' }], ['loaded', { stripe: 'loaded', server: { client_secret: 'x', session_id: SID } }]]) {
    for (const w of [390, 820, 1440]) { const ctx = await ctxFor(b, { ...o, w }); const p = await ctx.newPage(); await p.goto('http://localhost:8720' + (o.url || '/checkout/?plan=starter-deposit')); await p.waitForTimeout(900);
      console.log('sheet', name, w, await p.evaluate(() => { const s = document.querySelector('.till-pay').getBoundingClientRect(); const c = document.querySelector('.till-side .btn').getBoundingClientRect(); return 'sheet h ' + Math.round(s.height) + ', call button y ' + Math.round(c.top + scrollY); })); await ctx.close(); } }
  // 3. narrow and zoomed text, error states
  for (const [name, url, o] of [['co blocked', '/checkout/?plan=commerce-care', {}], ['co loaded care', '/checkout/?plan=commerce-care', { stripe: 'loaded', server: { client_secret: 'x' } }], ['ok care paid', '/checkout/success/?plan=commerce-care&session_id=' + SID, { server: { status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 100000, currency: 'usd', plan: 'commerce-care' } }]]) {
    for (const [w, zoom] of [[320, 1], [360, 1], [320, 2], [360, 2], [400, 2], [820, 2], [980, 2], [1120, 2], [1440, 2]]) { const ctx = await ctxFor(b, { ...o, w }); const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(700);
      if (zoom > 1) await p.evaluate(z => { document.documentElement.style.fontSize = (z * 100) + '%'; }, zoom); await p.waitForTimeout(100);
      const r = await p.evaluate(spill); console.log(name, w, 'x' + zoom, 'overflow', r.over, r.bad.length ? r.bad.join(' | ') : 'clean');
      if (w === 320 || (zoom === 2 && w === 360)) await p.screenshot({ path: `probe_${name.replace(/ /g, '-')}_${w}_x${zoom}.png`, fullPage: true });
      await ctx.close(); } }
  // 4. long price strings
  for (const url of ['/checkout/?plan=commerce-care', '/checkout/success/?plan=commerce-care']) { const ctx = await ctxFor(b, { stripe: 'loading', server: 'hang', w: 980 }); const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(700);
    await p.evaluate(() => { document.querySelector('.receipt-total b').textContent = '$1,234.56/month'; });
    const out = [];
    for (let w = 320; w <= 1920; w += 20) { await p.setViewportSize({ width: w, height: 900 }); const m = await p.evaluate(() => { const pr = document.querySelector('.receipt-total b').getBoundingClientRect(), rc = document.querySelector('.receipt').getBoundingClientRect(), cs = getComputedStyle(document.querySelector('.receipt')); return { out: Math.round(pr.right - (rc.right - parseFloat(cs.paddingRight))), left: Math.round((rc.left + parseFloat(cs.paddingLeft)) - pr.left), lines: Math.round(pr.height / parseFloat(getComputedStyle(document.querySelector('.receipt-total b')).fontSize)), over: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
      if (m.out > 0 || m.left > 0 || m.over > 0 || m.lines > 1) out.push(w + ': right +' + m.out + ' left +' + m.left + ' lines ' + m.lines + ' page ' + m.over); }
    console.log('long price', url, out.length ? out.join('; ') : 'fits on one line inside the slip at every width');
    await p.setViewportSize({ width: 980, height: 900 }); await p.screenshot({ path: 'probe_longprice_' + (url.includes('success') ? 'ok' : 'co') + '_980.png' }); await ctx.close(); }
  await b.close();
})();
