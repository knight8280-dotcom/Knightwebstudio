const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const OUT = __dirname + '/states/';
(async () => {
  const browser = await chromium.launch();
  for (const [name, w, h, theme, mob] of [['m-light', 390, 844, 'light', 1], ['m-dark', 390, 844, 'dark', 1], ['d-light', 1440, 900, 'light', 0], ['d-dark', 1440, 900, 'dark', 0]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: !!mob, hasTouch: !!mob });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    // fake captcha widget: a 303x78 box like the real one
    await ctx.route(/hcaptcha\.com/, r => r.fulfill({ contentType: 'application/javascript', body: `window.hcaptcha={render:function(el){el=typeof el==='string'?document.getElementById(el):el;el.innerHTML='<iframe style="width:303px;height:78px;border:1px solid #ccc;background:#fafafa" srcdoc="captcha placeholder"></iframe><textarea name="h-captcha-response" style="display:none">tok</textarea>';return 0;},reset:function(){}};(function(){var s=document.getElementById('hcaptcha-slot');if(s&&!s.firstChild)window.hcaptcha.render(s);var cb=new URLSearchParams((document.currentScript||{}).src?document.currentScript.src.split('?')[1]:'').get('onload');if(cb&&window[cb])window[cb]();})();` }));
    await ctx.route(/api\.web3forms\.com/, r => setTimeout(() => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true }) }), 1500));
    // Stripe stub
    await ctx.route(/js\.stripe\.com/, r => r.fulfill({ contentType: 'application/javascript', body: `window.Stripe=function(){return{initCheckoutFormSdk:function(){return{createForm:function(){return{mount:function(sel){var el=document.querySelector(sel);el.innerHTML='<div style="font:16px system-ui;color:#30313d;background:#fff"><label style="display:block;margin:0 0 4px">Email</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:12px"></div><label style="display:block;margin:0 0 4px">Card information</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:12px"></div><label style="display:block;margin:0 0 4px">Cardholder name</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:12px"></div><label style="display:block;margin:0 0 4px">Country or region</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:16px"></div><div style="background:#0570de;color:#fff;border-radius:4px;height:44px;line-height:44px;text-align:center;font-weight:600">Pay</div></div>';},on:function(){}};},loadActions:function(){return new Promise(function(res){setTimeout(function(){res({type:'success',actions:{confirm:function(){return Promise.resolve({})}}});}, window.__stripeDelay||50);});}};}};};` }));
    await ctx.route(/onrender\.com\/api\/create-checkout-session/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ client_secret: 'cs_test_secret', session_id: 'cs_test_abcdefghijklmnop' }) }));
    const statusBodies = {
      paid: { status: 'complete', payment_status: 'paid', mode: 'payment', plan: 'business-deposit', amount_total: 200000, currency: 'usd', label: 'Business website — 50% deposit' },
      care: { status: 'complete', payment_status: 'paid', mode: 'subscription', plan: 'commerce-care', amount_total: 100000, currency: 'usd', label: 'Commerce care plan' },
      ach: { status: 'complete', payment_status: 'unpaid', mode: 'payment', plan: 'commerce-deposit', amount_total: 400000, currency: 'usd' },
      open: { status: 'open', payment_status: 'unpaid', mode: 'payment', plan: 'starter-deposit', amount_total: 100000, currency: 'usd' },
    };
    let which = 'paid';
    await ctx.route(/onrender\.com\/api\/session-status/, r => which === 'fail' ? r.abort() : r.fulfill({ contentType: 'application/json', body: JSON.stringify(statusBodies[which]) }));

    const shot = async (page, file, opts) => { await page.screenshot({ path: OUT + name + '__' + file + '.png', ...(opts || {}) }); };
    // ---- contact form states
    let page = await ctx.newPage();
    await page.goto(BASE + '/contact/'); await page.waitForTimeout(500);
    const form = page.locator('#contact-form');
    await form.scrollIntoViewIfNeeded();
    await page.locator('#name').focus(); await page.waitForTimeout(300);
    await page.evaluate(() => { const f = document.getElementById('contact-form'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 90); }); await page.waitForTimeout(300);
    await shot(page, 'contact-1-focus-name');
    // keyboard focus on chips and select
    await page.locator('#package').focus(); await page.waitForTimeout(200);
    await page.keyboard.press('Tab'); await page.waitForTimeout(200);
    await page.keyboard.press('Space'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Space'); await page.waitForTimeout(200);
    await page.evaluate(() => { const f = document.getElementById('package'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 140); }); await page.waitForTimeout(300);
    await shot(page, 'contact-2-chips-checked-focus');
    // error state: submit empty
    await page.evaluate(() => document.getElementById('submit-btn').click()); await page.waitForTimeout(400);
    await page.evaluate(() => { const f = document.getElementById('contact-form'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 90); }); await page.waitForTimeout(300);
    await shot(page, 'contact-3-errors-top');
    await page.evaluate(() => { const f = document.getElementById('message'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 200); }); await page.waitForTimeout(300);
    await shot(page, 'contact-4-errors-bottom');
    const errInfo = await page.evaluate(() => [...document.querySelectorAll('#contact-form [id$="-error"], #form-status, #captcha-error')].map(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return [e.id, e.textContent, cs.fontSize, cs.color, Math.round(r.height), cs.minHeight]; }));
    console.log(name, 'errors', JSON.stringify(errInfo));
    // fill and send -> sending (disabled) -> success
    await page.fill('#name', 'Test Person'); await page.fill('#email', 'test@example.com'); await page.fill('#message', 'We need a new website for our shop please.');
    await page.evaluate(() => document.getElementById('submit-btn').click()); await page.waitForTimeout(350);
    await shot(page, 'contact-5-sending');
    console.log(name, 'sending btn', JSON.stringify(await page.evaluate(() => { const b = document.getElementById('submit-btn'); const cs = getComputedStyle(b); return [b.disabled, b.textContent, cs.opacity, cs.backgroundColor, cs.color, cs.cursor]; })));
    await page.waitForTimeout(1800);
    await shot(page, 'contact-6-success');
    console.log(name, 'status', JSON.stringify(await page.evaluate(() => { const s = document.getElementById('form-status'); const cs = getComputedStyle(s); const r = s.getBoundingClientRect(); return [s.className, s.textContent, cs.color, cs.backgroundColor, cs.fontSize, Math.round(r.top), innerHeight]; })));
    await page.close();
    // ---- checkout with plan
    for (const plan of ['business-deposit', 'commerce-care']) {
      page = await ctx.newPage(); await page.addInitScript(() => { window.__stripeDelay = 1200; });
      await page.goto(BASE + '/checkout/?plan=' + plan); await page.waitForTimeout(500);
      await shot(page, 'checkout-' + plan + '-loading');
      await page.waitForTimeout(1500);
      await shot(page, 'checkout-' + plan + '-ready', { fullPage: true });
      console.log(name, plan, JSON.stringify(await page.evaluate(() => { const g = id => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { t: e.textContent, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize }; }; const rec = document.getElementById('checkout-plan').getBoundingClientRect(); const pay = document.querySelector('.till-pay').getBoundingClientRect(); return { name: g('checkout-plan-name'), price: g('checkout-plan-price'), receipt: [Math.round(rec.left), Math.round(rec.top), Math.round(rec.width), Math.round(rec.height)], pay: [Math.round(pay.left), Math.round(pay.top), Math.round(pay.width), Math.round(pay.height)] }; })));
      await page.close();
    }
    // ---- success states
    for (const st of ['paid', 'care', 'ach', 'open', 'fail']) {
      which = st; page = await ctx.newPage();
      const plan = { paid: 'business-deposit', care: 'commerce-care', ach: 'commerce-deposit', open: 'starter-deposit', fail: 'growth-care' }[st];
      await page.goto(BASE + '/checkout/success/?plan=' + plan + '&session_id=cs_test_abcdefghijklmnop'); await page.waitForTimeout(900);
      await shot(page, 'success-' + st, { fullPage: true });
      await page.close();
    }
    // success without session (plan only) and bare
    page = await ctx.newPage(); await page.goto(BASE + '/checkout/success/?plan=starter-deposit'); await page.waitForTimeout(600); await shot(page, 'success-planonly', { fullPage: true }); await page.close();
    await ctx.close();
  }
  await browser.close();
})();
