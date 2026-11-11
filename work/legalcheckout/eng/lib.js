const { chromium } = require('playwright');
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const json = body => ({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(body) });
const SID = 'cs_test_a1b2c3d4e5f6g7h8';
// Stand-in for Stripe.js. mode: loading | loaded | refuse | reject
const stripeStub = mode => `
window.__confirmCalls = 0;
window.Stripe = function (key, opts) { window.__stripeKey = key; window.__stripeOpts = opts; return { initCheckoutFormSdk: function (o) {
  var target = null; var handlers = {};
  window.__fireConfirm = function () { if (handlers.confirm) handlers.confirm({ fake: true }); };
  function fake() {
    var el = document.querySelector(target); if (!el) return;
    el.innerHTML = '<div style="background:#ffffff;font:16px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#30313d">' +
      ['Email', 'Card information', 'Cardholder name', 'Country or region'].map(function (l) {
        return '<label style="display:block;margin:0 0 12px;font-size:14px">' + l + '<span style="display:block;height:44px;margin-top:4px;border:1px solid #e6e6e6;border-radius:4px;background:#fff"></span></label>'; }).join('') +
      '<div style="height:44px;margin-top:16px;border-radius:4px;background:#0570de;color:#fff;font-weight:600;display:grid;place-items:center">Pay</div></div>';
  }
  return {
    createForm: function () { return { mount: function (sel) { target = sel; window.__mounted = sel; }, on: function (ev, fn) { handlers[ev] = fn; } }; },
    loadActions: function () { return new Promise(function (res, rej) {
      var mode = ${JSON.stringify(mode)};
      if (mode === 'loading') return;
      o.clientSecret.then(function () {
        if (mode === 'refuse') return res({ type: 'error' });
        fake(); res({ type: 'success', actions: { confirm: function () { window.__confirmCalls++; return Promise.resolve(window.__confirmResult || { type: 'success' }); } } });
      }, rej);
    }); }
  };
} }; };`;
const VIEW = { m: [390, 844], s: [360, 740], p: [430, 932], t: [820, 1100], k: [768, 1024], n: [1000, 800], g: [1024, 768], l: [1280, 800], d: [1440, 900], w: [1920, 1080] };
async function open(browser, s, view, extra = {}) {
  const [dev, theme] = view.split('-'); const [w, h] = VIEW[dev];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, javaScriptEnabled: !s.nojs,
    isMobile: w < 700, hasTouch: w < 700, reducedMotion: extra.rm || 'no-preference' });
  if (!extra.noThemeStore) await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com/, r => r.abort());
  await ctx.route(/calendly\.com/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>calendly stub</title>ok' }));
  await ctx.route(/js\.stripe\.com/, r => s.stripe ? r.fulfill({ status: 200, contentType: 'text/javascript', body: stripeStub(s.stripe) }) : r.abort());
  const serverCalls = [];
  await ctx.route(/onrender\.com/, r => {
    serverCalls.push(r.request().method() + ' ' + r.request().url() + ' ' + (r.request().postData() || ''));
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    if (!s.server || s.server === 'abort') return r.abort();
    if (s.server === 'hang') return;
    return r.fulfill(s.server);
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  return { ctx, page, errors, serverCalls, w, h };
}
const S = {
  'co-blocked':   { url: '/checkout/?plan=starter-deposit', stripe: null },
  'co-noplan':    { url: '/checkout/', stripe: 'loaded' },
  'co-badplan':   { url: '/checkout/?plan=Bad%20Plan!', stripe: 'loaded' },
  'co-loading':   { url: '/checkout/?plan=starter-deposit', stripe: 'loading', server: 'hang' },
  'co-waking':    { url: '/checkout/?plan=business-deposit', stripe: 'loading', server: 'hang', wait: 8600 },
  'co-loaded':    { url: '/checkout/?plan=starter-deposit', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-business':  { url: '/checkout/?plan=business-deposit', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-commerce':  { url: '/checkout/?plan=commerce-deposit', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-essential': { url: '/checkout/?plan=essential-care', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-growth':    { url: '/checkout/?plan=growth-care', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-care':      { url: '/checkout/?plan=commerce-care', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) },
  'co-serverdown':{ url: '/checkout/?plan=starter-deposit', stripe: 'loaded', server: 'abort' },
  'co-server500': { url: '/checkout/?plan=starter-deposit', stripe: 'loaded', server: { status: 500, headers: cors, body: '{}' } },
  'co-unknown':   { url: '/checkout/?plan=mystery-plan', stripe: 'loaded', server: { status: 400, headers: cors, body: '{}' } },
  'co-refused':   { url: '/checkout/?plan=growth-care', stripe: 'refuse', server: json({ client_secret: 'x' }) },
  'co-nojs':      { url: '/checkout/?plan=starter-deposit', stripe: null, nojs: true },
  'ok-bare':      { url: '/checkout/success/' },
  'ok-plan':      { url: '/checkout/success/?plan=starter-deposit' },
  'ok-care':      { url: '/checkout/success/?plan=growth-care' },
  'ok-confirming':{ url: '/checkout/success/?plan=starter-deposit&session_id=' + SID, server: 'hang' },
  'ok-paid':      { url: '/checkout/success/?plan=starter-deposit&session_id=' + SID, server: json({ status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 100000, currency: 'usd', plan: 'starter-deposit', label: 'Starter website — 50% deposit' }) },
  'ok-care-paid': { url: '/checkout/success/?plan=commerce-care&session_id=' + SID, server: json({ status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 100000, currency: 'usd', plan: 'commerce-care' }) },
  'ok-ach':       { url: '/checkout/success/?plan=business-deposit&session_id=' + SID, server: json({ status: 'complete', payment_status: 'unpaid', mode: 'payment', amount_total: 200000, currency: 'usd', plan: 'business-deposit' }) },
  'ok-unpaid':    { url: '/checkout/success/?plan=commerce-deposit&session_id=' + SID, server: json({ status: 'open', payment_status: 'unpaid', mode: 'payment', amount_total: 400000, currency: 'usd', plan: 'commerce-deposit' }) },
  'ok-longlabel': { url: '/checkout/success/?plan=zzz&session_id=' + SID, server: json({ status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 123456, currency: 'usd', plan: 'zzz', label: 'Custom automation workflow and lead follow-up system — monthly plan' }) },
  'ok-serverdown':{ url: '/checkout/success/?plan=starter-deposit&session_id=' + SID, server: 'abort' },
  'ok-nojs':      { url: '/checkout/success/?plan=starter-deposit', nojs: true },
};
module.exports = { chromium, open, S, VIEW, json, cors, SID, stripeStub };
