// Checkout and success states that need no payment. Real services unless a line says "mock".
const { launch, watch } = require('./lib');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8720';
const tag = process.argv[3] || 'new';
const sess = require('./checkout-new.json');
const REAL_OPEN = sess['starter-deposit'].session_id;      // unpaid session created by loading the page
const REAL_OPEN_CARE = sess['growth-care'].session_id;
const out = {};
const CASES = [
  // [key, path, setup(ctx/page), waitMs]
  ['co-noplan', '/checkout/', null, 2500],
  ['co-badregex', '/checkout/?plan=Starter_Deposit', null, 2500],
  ['co-unknownplan', '/checkout/?plan=no-such-plan', null, 9000],                       // real 400 from the server
  ['co-stripeblocked', '/checkout/?plan=starter-deposit', async ctx => ctx.route(/js\.stripe\.com/, r => r.abort()), 2500],
  ['co-serverdown', '/checkout/?plan=starter-deposit', async ctx => ctx.route(/onrender\.com/, r => r.abort()), 9000],
  ['co-serverslow', '/checkout/?plan=starter-deposit', async ctx => ctx.route(/onrender\.com\/api/, r => setTimeout(() => r.abort().catch(() => {}), 14000)), 10000], // shows the 8s "Waking up" line
  ['co-nojs', '/checkout/?plan=starter-deposit', 'nojs', 1500],
  ['ok-plain', '/checkout/success/', null, 1500],
  ['ok-plan-deposit', '/checkout/success/?plan=business-deposit', null, 1500],
  ['ok-plan-care', '/checkout/success/?plan=essential-care', null, 1500],
  ['ok-real-notcompleted', '/checkout/success/?plan=starter-deposit&session_id=' + REAL_OPEN, null, 9000],          // real server answer: open/unpaid
  ['ok-real-notcompleted-care', '/checkout/success/?plan=growth-care&session_id=' + REAL_OPEN_CARE, null, 9000],
  ['ok-real-unknownsession', '/checkout/success/?plan=starter-deposit&session_id=cs_live_FAKEFAKEFAKEFAKE0000', null, 9000], // real 404
  ['ok-serverdown', '/checkout/success/?plan=starter-deposit&session_id=cs_live_FAKEFAKEFAKEFAKE0000', async ctx => ctx.route(/onrender\.com/, r => r.abort()), 3000],
  ['ok-confirming', '/checkout/success/?plan=commerce-deposit&session_id=cs_live_FAKEFAKEFAKEFAKE0000', async ctx => ctx.route(/onrender\.com/, r => setTimeout(() => r.abort().catch(() => {}), 9000)), 2500],
  ['ok-mock-paid-deposit', '/checkout/success/?plan=commerce-deposit&session_id=cs_live_MOCKMOCKMOCKMOCK0000', async ctx => ctx.route(/session-status/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ status: 'complete', payment_status: 'paid', plan: 'commerce-deposit', label: 'Commerce Website 50% Deposit', mode: 'payment', amount_total: 400000, currency: 'usd' }) })), 2500],
  ['ok-mock-paid-care', '/checkout/success/?plan=commerce-care&session_id=cs_live_MOCKMOCKMOCKMOCK0000', async ctx => ctx.route(/session-status/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ status: 'complete', payment_status: 'paid', plan: 'commerce-care', label: 'Commerce Care Plan', mode: 'subscription', amount_total: 100000, currency: 'usd' }) })), 2500],
  ['ok-mock-ach-processing', '/checkout/success/?plan=business-deposit&session_id=cs_live_MOCKMOCKMOCKMOCK0000', async ctx => ctx.route(/session-status/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ status: 'complete', payment_status: 'unpaid', plan: 'business-deposit', label: 'Business Website 50% Deposit', mode: 'payment', amount_total: 200000, currency: 'usd' }) })), 2500],
];
const only = process.argv[4] ? process.argv[4].split(',') : null;
const MODES = [['m390', 390, 844, true], ['d1280', 1280, 800, false]];
(async () => {
  const b = await launch();
  for (const [key, path, setup, wait] of CASES) {
    if (only && !only.includes(key)) continue;
    for (const [mname, w, h, mob] of MODES) for (const theme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, colorScheme: theme, javaScriptEnabled: setup !== 'nojs' });
      await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
      if (typeof setup === 'function') await setup(ctx);
      const page = await ctx.newPage(); const log = []; watch(page, log);
      const id = `${key}__${mname}-${theme}`;
      try { await page.goto(base + path, { waitUntil: 'load', timeout: 60000 }); } catch (e) { out[id] = { error: String(e).slice(0, 300) }; await ctx.close(); continue; }
      await page.waitForTimeout(wait);
      const m = await page.evaluate(() => {
        const g = id => document.getElementById(id); const R = e => { if (!e) return null; const x = e.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top + scrollY), Math.round(x.width), Math.round(x.height)]; };
        const vis = e => !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
        const st = g('checkout-status') || g('success-status');
        const o = { theme: document.documentElement.getAttribute('data-theme'), overflowX: document.documentElement.scrollWidth - innerWidth, pageH: document.documentElement.scrollHeight,
          h1: document.querySelector('h1').textContent, lede: (document.querySelector('.lede') || {}).textContent,
          status: st && { text: st.textContent, cls: st.className, visible: vis(st), rect: R(st), color: getComputedStyle(st).color, bg: getComputedStyle(st.closest('.card,.till,section')).backgroundColor } };
        if (g('checkout-form')) Object.assign(o, { card: R(g('checkout-form').closest('.card')), form: R(g('checkout-form')), formIframes: g('checkout-form').querySelectorAll('iframe').length, receiptVisible: vis(g('checkout-plan')), noscriptShown: !!document.querySelector('noscript') && getComputedStyle(document.querySelector('.till-pay noscript')).display,
          statusLink: (a => a && { href: a.getAttribute('href'), rect: R(a) })(st.querySelector('a')) });
        if (g('success-title')) Object.assign(o, { receiptVisible: vis(g('success-plan')), receipt: g('success-plan-name').textContent + ' | ' + g('success-plan-price').textContent, stepsProject: vis(g('success-steps-project')), stepsCare: vis(g('success-steps-care')), next: vis(g('success-next')),
          book: (a => ({ vis: vis(a), text: a.textContent, href: a.href, target: a.target, rel: a.rel }))(g('success-book')), retry: (a => ({ vis: vis(a), text: a.textContent, href: a.getAttribute('href') }))(g('success-retry')),
          buttons: [...document.querySelectorAll('.till .btn')].filter(vis).map(a => a.textContent.trim() + '@' + R(a).join(',')) });
        return o;
      });
      const f = `shots/states/${tag}__${id}.png`; await page.screenshot({ path: f, fullPage: !/^co-(unknownplan|serverdown|serverslow)/.test(key) });
      out[id] = { m, file: f, log: log.filter(l => l.t !== 'response' || l.status >= 400 || /onrender/.test(l.url)).filter(l => !/Origin trial|GL Driver/.test(l.text || '')) };
      await ctx.close();
    }
    console.log('done', key);
  }
  fs.writeFileSync(`states-${tag}.json`, JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
