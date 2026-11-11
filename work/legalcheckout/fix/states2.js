#!/usr/bin/env node
/* Every state of /checkout/ and /checkout/success/, with Stripe.js and the payment server stubbed.
   node states.js --out DIR [--only name,name] [--views m-light,d-light,...] [--base http://localhost:8720] */
const { chromium } = require('playwright');
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8720');
const out = arg('out'); fs.mkdirSync(out, { recursive: true });
const only = (arg('only', '') || '').split(',').filter(Boolean);
const views = arg('views', 'm-light,d-light').split(',');
const VIEW = { i: [1024, 768], k: [1100, 800], e: [980, 800], x: [320, 640], p: [600, 900], m: [390, 844], s: [360, 740], t: [820, 1100], l: [1280, 800], d: [1440, 900], n: [1000, 800], w: [1920, 1080] };

// A stand-in for Stripe.js: mode 'loading' never finishes, 'loaded' mounts a plain form, 'refuse' resolves with an error result
const stripeStub = mode => `
window.Stripe = function () { return { initCheckoutFormSdk: function (o) {
  var target = null;
  function fake() {
    var el = document.querySelector(target); if (!el) return;
    el.innerHTML = '<div style="font:16px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#30313d">' +
      ['Email', 'Card information', 'Cardholder name', 'Country or region'].map(function (l) {
        return '<label style="display:block;margin:0 0 12px;font-size:14px">' + l + '<span style="display:block;height:44px;margin-top:4px;border:1px solid #e6e6e6;border-radius:4px;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.03)"></span></label>'; }).join('') +
      '<div style="height:44px;margin-top:16px;border-radius:4px;background:#0570de;color:#fff;font-weight:600;display:grid;place-items:center">Pay</div></div>';
  }
  return {
    createForm: function () { return { mount: function (sel) { target = sel; }, on: function () {} }; },
    loadActions: function () { return new Promise(function (res, rej) {
      if (${JSON.stringify(mode)} === 'loading') return;
      o.clientSecret.then(function () {
        if (${JSON.stringify(mode)} === 'refuse') return res({ type: 'error' });
        fake(); res({ type: 'success', actions: { confirm: function () { return Promise.resolve({ type: 'error' }); } } });
      }, rej);
    }); }
  };
} }; };`;
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = body => ({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
const SID = 'cs_test_a1b2c3d4e5f6g7h8';

const S = {
  // ---- /checkout/
  'co-blocked':   { url: '/checkout/?plan=starter-deposit', stripe: null },                       // ad blocker: Stripe.js never loads
  'co-noplan':    { url: '/checkout/', stripe: 'loaded' },
  'co-loading':   { url: '/checkout/?plan=starter-deposit', stripe: 'loading', server: 'hang' },
  'co-waking':    { url: '/checkout/?plan=business-deposit', stripe: 'loading', server: 'hang', wait: 8600 },
  'co-loaded':    { url: '/checkout/?plan=starter-deposit', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-care':      { url: '/checkout/?plan=commerce-care', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-commerce':  { url: '/checkout/?plan=commerce-deposit', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-serverdown':{ url: '/checkout/?plan=starter-deposit', stripe: 'loaded', server: 'abort' },
  'co-unknown':   { url: '/checkout/?plan=mystery-plan', stripe: 'loaded', server: { status: 400, headers: cors, body: '{}' } },
  'co-refused':   { url: '/checkout/?plan=growth-care', stripe: 'refuse', server: json({ client_secret: 'x' }) },
  'co-nojs':      { url: '/checkout/?plan=starter-deposit', stripe: null, nojs: true },
  // ---- /checkout/success/
  'ok-bare':      { url: '/checkout/success/' },
  'ok-plan':      { url: '/checkout/success/?plan=starter-deposit' },
  'ok-care':      { url: '/checkout/success/?plan=growth-care' },
  'ok-confirming':{ url: '/checkout/success/?plan=starter-deposit&session_id=' + SID, server: 'hang' },
  'ok-paid':      { url: '/checkout/success/?plan=starter-deposit&session_id=' + SID, server: json({ status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 100000, currency: 'usd', plan: 'starter-deposit', label: 'Starter website — 50% deposit' }) },
  'ok-care-paid': { url: '/checkout/success/?plan=commerce-care&session_id=' + SID, server: json({ status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 100000, currency: 'usd', plan: 'commerce-care' }) },
  'ok-ach':       { url: '/checkout/success/?plan=business-deposit&session_id=' + SID, server: json({ status: 'complete', payment_status: 'unpaid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' }) },
  'ok-unpaid':    { url: '/checkout/success/?plan=commerce-deposit&session_id=' + SID, server: json({ status: 'open', payment_status: 'unpaid', mode: 'payment', amount_total: 400000, currency: 'usd', plan: 'commerce-deposit' }) },
  'ok-serverdown':{ url: '/checkout/success/?plan=starter-deposit&session_id=' + SID, server: 'abort' },
  'ok-nojs':      { url: '/checkout/success/?plan=starter-deposit', nojs: true },
};

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const view of views) {
    const [dev, theme] = view.split('-'); const [w, h] = VIEW[dev];
    for (const [name, s] of Object.entries(S)) {
      if (only.length && !only.some(o => name === o || name.startsWith(o))) continue;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, javaScriptEnabled: !s.nojs,
        isMobile: dev === 'm' || dev === 's', hasTouch: dev === 'm' || dev === 's' });
      await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
      await ctx.route(/js\.stripe\.com/, r => s.stripe ? r.fulfill({ status: 200, contentType: 'text/javascript', body: stripeStub(s.stripe) }) : r.abort());
      await ctx.route(/onrender\.com/, r => {
        if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
        if (!s.server || s.server === 'abort') return r.abort();
        if (s.server === 'hang') return;           // never answers
        return r.fulfill(s.server);
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(base + s.url, { waitUntil: 'load' });
      await page.waitForTimeout(s.wait || 1200);
      const m = await page.evaluate(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth, h: document.documentElement.scrollHeight,
        clipped: [...document.querySelectorAll('.receipt-total b')].filter(b => b.offsetParent && b.scrollWidth > b.parentElement.clientWidth + 1).length,
        price: [...document.querySelectorAll('.receipt-total b')].filter(b => b.offsetParent).map(b => Math.round(b.getBoundingClientRect().width) + '/' + Math.round(b.parentElement.getBoundingClientRect().width)).join(' ') }));
      report[`${name}__${view}`] = { ...m, errors };
      await page.screenshot({ path: `${out}/${name}__${view}.png`, fullPage: true });
      await ctx.close();
    }
  }
  await browser.close();
  for (const [k, v] of Object.entries(report)) console.log(k.padEnd(30), 'h', String(v.h).padEnd(5), 'overflow', v.over, 'price', v.price || '-', v.clipped ? 'CLIPPED' : '', v.errors.length ? 'ERR ' + v.errors.join(' | ') : '');
})();
