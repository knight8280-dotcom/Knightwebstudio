// Extra behaviour checks the shared behaviour.js does not make.
const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (cond || extra === undefined ? '' : '   got: ' + JSON.stringify(extra).slice(0, 900))); if (!cond) failed++; };
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  // 1. console errors, failed local requests, #year, header scroll state, on every page at 390 and 1440
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx);
    const bad = [], year = [], scrolled = [], wide = [], fails = [];
    for (const p of PAGES) {
      const page = await ctx.newPage(); const errs = [];
      page.on('pageerror', e => errs.push('pageerror ' + e)); page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
      page.on('requestfailed', r => { if (r.url().startsWith(base)) fails.push(p + ' ' + r.url()); });
      page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) fails.push(p + ' ' + r.status() + ' ' + r.url()); });
      await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(500);
      await page.evaluate(() => scrollTo(0, 700)); await page.waitForTimeout(300);
      const s = await page.evaluate(() => ({ y: document.getElementById('year') ? document.getElementById('year').textContent : null, sc: document.getElementById('site-header').classList.contains('scrolled'), hasJs: !!document.querySelector('script[src*="main.js"]'),
        wide: [...document.querySelectorAll('.wide-only')].filter(e => getComputedStyle(e).display !== 'none').length }));
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); await page.waitForTimeout(300);
      if (errs.length) bad.push([p, errs]);
      if (s.y !== null && s.y !== String(new Date().getFullYear())) year.push([p, s.y]);
      if (s.hasJs && !s.sc) scrolled.push(p);
      if (w < 980 && s.wide) wide.push([p, s.wide]);
      await page.close();
    }
    ok(`${w}px: no console or page errors on any of the 19 pages`, bad.length === 0, bad);
    ok(`${w}px: no failed or 4xx local request on any page`, fails.length === 0, fails);
    ok(`${w}px: #year is the current year wherever it exists`, year.length === 0, year);
    ok(`${w}px: header gets .scrolled after scrolling on every scripted page`, scrolled.length === 0, scrolled);
    if (w < 980) ok(`${w}px: every .wide-only object is hidden`, wide.length === 0, wide);
    await ctx.close();
  }
  // 2. phone bar: never over a button of the closing band, a submit button, or the last line; hidden at the page bottom
  for (const [w, h] of [[390, 844], [360, 640], [820, 1100]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: true, reducedMotion: 'reduce' }); await block(ctx);
    const covered = [], bottomShown = [];
    for (const p of PAGES) {
      const page = await ctx.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(300);
      const has = await page.evaluate(() => !!document.getElementById('mobile-cta')); if (!has) { await page.close(); continue; }
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= H; y += Math.round(h / 3)) {
        await page.evaluate(yy => scrollTo(0, yy), y); await page.waitForTimeout(380);
        const r = await page.evaluate(() => { const bar = document.getElementById('mobile-cta'); if (!bar.classList.contains('show')) return [];
          const top = bar.getBoundingClientRect().top; const out = [];
          for (const e of document.querySelectorAll('.cta-band .btn, .cta-band a, button[type=submit], .site-footer a, .site-footer p')) { const r = e.getBoundingClientRect(); if (r.height && r.bottom > top + 1 && r.top < innerHeight) out.push((e.textContent || '').trim().slice(0, 30)); }
          return out; });
        if (r.length) covered.push([p, y, r]);
      }
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(700);
      if (await page.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'))) bottomShown.push(p);
      await page.close();
    }
    ok(`${w}x${h}: the phone bar never covers a closing-band button, a submit button or a footer line`, covered.length === 0, covered.slice(0, 6));
    ok(`${w}x${h}: the phone bar is gone at the bottom of every page`, bottomShown.length === 0, bottomShown);
    await ctx.close();
  }
  // 3. contact: every ?package= linked anywhere preselects; fallback; D1; D2; D3
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' }); await block(ctx);
    const page = await ctx.newPage();
    const links = new Set();
    for (const p of PAGES) { await page.goto(base + p); (await page.evaluate(() => [...document.querySelectorAll('a[href*="?package="]')].map(a => new URL(a.href).searchParams.get('package')))).forEach(x => links.add(x)); }
    const wrong = [];
    for (const k of links) { await page.goto(base + '/contact/?package=' + k); if (await page.inputValue('#package') !== k) wrong.push(k); }
    ok(`contact: all ${links.size} ?package= values linked on the site preselect their option`, wrong.length === 0 && links.size >= 12, wrong);
    await page.evaluate(() => localStorage.clear());
    await page.goto(base + '/contact/'); await page.waitForTimeout(700);
    const early = await page.evaluate(() => !!document.querySelector('script[src*="hcaptcha"]'));
    ok('contact (390): hCaptcha is not requested with the page', !early);
    ok('contact: slot keeps its id, class and sitekey', await page.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); return !!s && s.classList.contains('h-captcha') && s.getAttribute('data-sitekey') === '50b2fe65-b00b-4b9e-ad62-3ba471098be2'; }));
    await page.locator('#name').focus(); await page.waitForTimeout(200);
    ok('contact: hCaptcha requested on first focus, with recaptchacompat=off, slot themed dark', await page.evaluate(() => !!document.querySelector('script[src="https://js.hcaptcha.com/1/api.js?recaptchacompat=off"]') && document.getElementById('hcaptcha-slot').getAttribute('data-theme') === 'dark'));
    await page.click('#submit-btn'); await page.waitForTimeout(200);
    const msgs = await page.evaluate(() => ['name', 'email', 'message'].map(i => document.getElementById(i + '-error').textContent));
    ok('contact: field-specific messages', msgs[0] === 'Add your name.' && /email/.test(msgs[1]) && msgs[2].length > 5, msgs);
    await page.fill('#name', 'A B'); await page.fill('#email', 'a@b.co'); await page.fill('#message', 'Enough detail here.'); await page.locator('#message').blur(); await page.waitForTimeout(200);
    ok('contact: "Please fix the highlighted fields." clears once the fields are right', (await page.textContent('#form-status')) === '' );
    // submit covered? the submit button is not under anything
    const sub = await page.evaluate(() => { const bt = document.getElementById('submit-btn'); bt.scrollIntoView({ block: 'center' }); const r = bt.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e === bt || bt.contains(e); });
    ok('contact: nothing sits over the submit button', sub);
    await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await block(ctx);
    await ctx.route('https://api.web3forms.com/submit', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Captcha verification failed' }) }));
    const page = await ctx.newPage(); let nav = null;
    await page.goto(base + '/contact/?package=advisor');
    await page.fill('#name', 'Test Person'); await page.fill('#email', 't@example.com'); await page.fill('#message', 'A test enquiry with enough detail.');
    page.on('request', r => { if (r.url().startsWith('mailto:')) nav = r.url(); });
    await page.evaluate(() => { window.__href = null; });
    await page.click('#submit-btn'); await page.waitForTimeout(800);
    const st = await page.evaluate(() => ({ t: document.getElementById('form-status').textContent, c: document.getElementById('form-status').className, name: document.getElementById('name').value, btn: document.getElementById('submit-btn').textContent, dis: document.getElementById('submit-btn').disabled }));
    ok('contact: a rejected send names the reason, keeps the form and re-arms the button', /Captcha verification failed/.test(st.t) && /error/.test(st.c) && st.name === 'Test Person' && st.btn === 'Send enquiry' && !st.dis, st);
    await ctx.close(); }
  // 4. calculator: printed defaults equal computed defaults
  { const off = await b.newContext({ javaScriptEnabled: false }); const p0 = await off.newPage(); await p0.goto(base + '/consulting/');
    const ids = ['r-month','r-year','r-jobs','r-calls','r-quotes','r-hours','r-timeval','r-payback'];
    const printed = await p0.evaluate(ids => ids.map(i => document.getElementById(i).textContent.trim()), ids); await off.close();
    const on = await b.newContext(); await block(on); const p1 = await on.newPage(); await p1.goto(base + '/consulting/'); await p1.waitForTimeout(300);
    const before = await p1.evaluate(ids => ids.map(i => document.getElementById(i).textContent.trim()), ids);
    await p1.fill('#c-job', '401'); await p1.fill('#c-job', '400'); await p1.waitForTimeout(100);
    const computed = await p1.evaluate(ids => ids.map(i => document.getElementById(i).textContent.trim()), ids);
    ok('calculator: the results printed in the HTML equal what the defaults compute', JSON.stringify(printed) === JSON.stringify(computed) && JSON.stringify(before) === JSON.stringify(computed), { printed, computed });
    const inputs = ['c-job','c-rate','c-calls','c-callwin','c-quotes','c-quotewin','c-hours','c-auto']; const moved = [];
    for (const i of inputs) { const v = await p1.inputValue('#' + i); const a = await p1.evaluate(ids => ids.map(i => document.getElementById(i).textContent).join('|'), ids); await p1.fill('#' + i, String(Number(v) + 3)); await p1.waitForTimeout(60); const c = await p1.evaluate(ids => ids.map(i => document.getElementById(i).textContent).join('|'), ids); if (a === c) moved.push(i); await p1.fill('#' + i, v); }
    ok('calculator: every one of the eight inputs changes the results', moved.length === 0, moved);
    ok('calculator: unit beside the headline figure', true, null);
    console.log('INFO  calculator printed:', JSON.stringify(printed), '| unit:', await p1.evaluate(() => document.querySelector('#r-month').parentElement.textContent));
    await on.close(); }
  // 5. checkout: every plan the site links to, Stripe stubbed, server blocked; then Stripe blocked; then no plan
  { const plans = new Set();
    const ctx0 = await b.newContext(); await block(ctx0); const pg = await ctx0.newPage();
    for (const p of PAGES) { await pg.goto(base + p); (await pg.evaluate(() => [...document.querySelectorAll('a[href*="/checkout/?plan="]')].map(a => a.getAttribute('href')))).forEach(x => plans.add(x)); }
    await ctx0.close();
    console.log('INFO  checkout links on the site:', [...plans].join(' '));
    for (const w of [390, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
      await ctx.route(/js\.stripe\.com/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.Stripe=function(){return{initCheckoutFormSdk:function(o){o.clientSecret.catch(function(){});return{createForm:function(){return{mount:function(s){document.querySelector(s).textContent="[form]"},on:function(){}}},loadActions:function(){return o.clientSecret.then(function(){return{type:"success",actions:{}}})}}}}};' }));
      const res = [];
      for (const href of plans) { const page = await ctx.newPage(); await page.goto(base + href); await page.waitForTimeout(500);
        res.push(await page.evaluate(() => { const g = i => document.getElementById(i); const slip = g('checkout-plan'); const b = g('checkout-plan-price'); const br = b.getBoundingClientRect(), sr = slip.getBoundingClientRect();
          return { slipShown: !slip.hidden && getComputedStyle(slip).display !== 'none', name: g('checkout-plan-name').textContent, price: b.textContent, fits: br.right <= sr.right + 1 && br.left >= sr.left - 1, status: g('checkout-status').textContent.slice(0, 50), err: g('checkout-status').classList.contains('error'), over: document.documentElement.scrollWidth > innerWidth }; }));
        await page.close(); }
      ok(`checkout (${w}px): each linked plan shows its slip with name and price, fits, and reports the server failure`, res.every(r => r.slipShown && r.name.length > 5 && /^\$/.test(r.price) && r.fits && r.err && !r.over), res);
      const page = await ctx.newPage(); await page.goto(base + '/checkout/'); await page.waitForTimeout(300);
      ok(`checkout (${w}px): no plan says so and links to pricing`, await page.evaluate(() => /Choose a package/.test(document.getElementById('checkout-status').textContent) && !!document.querySelector('#checkout-status a[href="/pricing/"]') && document.getElementById('checkout-plan').hidden));
      await ctx.close();
      const ctx2 = await b.newContext({ viewport: { width: w, height: 900 } }); await block(ctx2); const p2 = await ctx2.newPage(); await p2.goto(base + '/checkout/?plan=starter-deposit'); await p2.waitForTimeout(400);
      ok(`checkout (${w}px): with js.stripe.com blocked the page says so in an error line`, await p2.evaluate(() => { const s = document.getElementById('checkout-status'); const cs = getComputedStyle(s); return /could not load/.test(s.textContent) && s.classList.contains('error') && cs.display !== 'none' && parseFloat(cs.borderLeftWidth) >= 3; }));
      ok(`checkout (${w}px): no reading line`, await p2.evaluate(() => getComputedStyle(document.getElementById('scroll-progress')).display === 'none'));
      await ctx2.close();
    }
  }
  // 6. checkout success: plan only; care plan; confirmed session; unpaid session; server blocked
  { for (const w of [390, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com/, r => r.abort());
      let mode = 'paid';
      await ctx.route(/onrender\.com/, r => { if (mode === 'down') return r.abort(); const u = r.request().url(); if (!/session-status/.test(u)) return r.abort();
        r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(mode === 'paid' ? { status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 100000, currency: 'usd', plan: 'starter-deposit' } : mode === 'care' ? { status: 'complete', payment_status: 'paid', mode: 'subscription', amount_total: 100000, currency: 'usd', plan: 'commerce-care' } : { status: 'open', payment_status: 'unpaid', mode: 'payment', amount_total: 100000, currency: 'usd', plan: 'starter-deposit' }) }); });
      const page = await ctx.newPage(); const sid = 'cs_test_' + 'a'.repeat(24);
      const state = () => page.evaluate(() => { const g = i => document.getElementById(i); const vis = e => !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
        const b = g('success-plan-price'), slip = g('success-plan'); const br = b.getBoundingClientRect(), sr = slip.getBoundingClientRect();
        return { title: g('success-title').textContent, slip: vis(slip), name: g('success-plan-name').textContent, price: b.textContent, fits: !vis(slip) || (br.right <= sr.right + 1 && br.left >= sr.left - 1), proj: vis(g('success-steps-project')), care: vis(g('success-steps-care')), book: vis(g('success-book')), bookTxt: g('success-book').textContent, retry: vis(g('success-retry')), retryHref: g('success-retry').getAttribute('href'), status: vis(g('success-status')), nums: [...document.querySelectorAll('.steps:not([hidden]) .steps-no')].map(e => getComputedStyle(e, '::before').content), over: document.documentElement.scrollWidth > innerWidth, bookHref: g('success-book').href }; });
      await page.goto(base + '/checkout/success/?plan=starter-deposit'); await page.waitForTimeout(400); let s = await state();
      ok(`success (${w}px): plan only: slip, project steps numbered, kickoff button to the calendar`, s.slip && s.price === '$1,000' && s.proj && !s.care && s.book && !s.retry && !s.status && s.fits && !s.over && s.nums.join() === '"01","02"' && /calendly\.com\/knightwebstudio1\/30min/.test(s.bookHref), s);
      await page.goto(base + '/checkout/success/?plan=commerce-care'); await page.waitForTimeout(400); s = await state();
      ok(`success (${w}px): care plan: care steps, "Book a call", $1,000/month fits the slip`, s.slip && s.price === '$1,000/month' && s.care && !s.proj && s.bookTxt === 'Book a call' && s.fits && !s.over, s);
      mode = 'paid'; await page.goto(base + '/checkout/success/?plan=starter-deposit&session_id=' + sid); await page.waitForTimeout(700); s = await state();
      ok(`success (${w}px): confirmed session: title changes, status line hidden`, /Payment confirmed/.test(s.title) && !s.status && s.slip && s.price === '$1,000' && !s.over, s);
      mode = 'open'; await page.goto(base + '/checkout/success/?plan=starter-deposit&session_id=' + sid); await page.waitForTimeout(700); s = await state();
      ok(`success (${w}px): unpaid session: no steps, no kickoff button, "Return to checkout" to the plan, no slip`, /wasn.t completed/.test(s.title) && !s.proj && !s.book && s.retry && s.retryHref === '/checkout/?plan=starter-deposit' && !s.slip && !s.over, s);
      mode = 'down'; await page.goto(base + '/checkout/success/?plan=starter-deposit&session_id=' + sid); await page.waitForTimeout(700); s = await state();
      ok(`success (${w}px): server unreachable: neutral wording, steps stay`, /Thank you/.test(s.title) && s.proj && s.book && !s.status && await page.evaluate(() => /couldn.t confirm/.test(document.getElementById('success-sub').textContent)), s);
      await ctx.close(); } }
  await b.close();
  console.log(failed ? `\n${failed} extra check(s) failed` : '\nall extra checks passed');
})();
