#!/usr/bin/env node
/* Behaviour test for assets/js/main.js and the page wiring, in a real browser.
   node tools/behaviour.js [--base http://localhost:8720]
   Prints one PASS/FAIL line per check; exit code 1 if anything fails. */
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8720').replace(/\/$/, '');
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (cond || extra === undefined ? '' : '   got: ' + JSON.stringify(extra))); if (!cond) failed++; };
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const watch = p => { p.on('pageerror', e => errors.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); }); };

  // ---------- theme
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' }); await block(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/'); const html = p.locator('html');
    ok('theme: light by default', await html.getAttribute('data-theme') === 'light');
    ok('theme: toggle label says what it will do', await p.getAttribute('#theme-toggle', 'aria-label') === 'Switch to dark theme');
    await p.click('#theme-toggle');
    ok('theme: toggle switches to dark', await html.getAttribute('data-theme') === 'dark');
    ok('theme: label flips', await p.getAttribute('#theme-toggle', 'aria-label') === 'Switch to light theme');
    ok('theme: choice saved', await p.evaluate(() => localStorage.getItem('theme')) === 'dark');
    ok('theme: browser colour follows', await p.getAttribute('meta[name="theme-color"]', 'content') === '#131722');
    ok('theme: page is actually dark', await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(19, 23, 34)');
    await p.goto(base + '/pricing/');
    ok('theme: persists on the next page', await html.getAttribute('data-theme') === 'dark');
    await p.click('#theme-toggle');
    ok('theme: toggles back to light', await html.getAttribute('data-theme') === 'light' && await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(246, 240, 228)');
    await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }); await block(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/');
    ok('theme: a device set to dark gets night with no saved choice', await p.locator('html').getAttribute('data-theme') === 'dark');
    ok('header: year is current', await p.textContent('#year') === String(new Date().getFullYear()));
    ok('header: phone number is real text, a tel: link', (await p.textContent('.header-tel')).includes('(225) 255-0837') && await p.getAttribute('.header-tel', 'href') === 'tel:+12252550837');
    ok('header: at the top the phone number is in the strip only, not printed twice', !(await p.isVisible('.header-tel')) && await p.isVisible('.topbar-tel'));
    ok('header: the button books the free call', await p.evaluate(() => { const a = document.querySelector('.header-cta'); return a.hasAttribute('data-booking') && a.textContent.trim() === 'Book a free call'; }));
    ok('top strip: city and tap-to-call', (await p.textContent('.topbar')).includes('Baton Rouge, Louisiana') && await p.getAttribute('.topbar-tel', 'href') === 'tel:+12252550837');
    await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(300);
    ok('header: scrolled state after scrolling', await p.evaluate(() => document.getElementById('site-header').classList.contains('scrolled')));
    await p.waitForTimeout(400);
    ok('header: phone number shows at 1440 once the strip has scrolled away', await p.isVisible('.header-tel'));
    ok('header: reading line moves', await p.evaluate(() => getComputedStyle(document.getElementById('scroll-progress')).transform !== 'matrix(0, 0, 0, 1, 0, 0)'));
    const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.href, a.target, a.rel]));
    ok('booking: every [data-booking] opens the calendar in a new tab', bk.length > 0 && bk.every(x => x[0] === 'https://calendly.com/knightwebstudio1/30min' && x[1] === '_blank' && x[2] === 'noopener'), bk[0]);
    ok('analytics: Plausible script queued', await p.evaluate(() => !!document.querySelector('script[src*="plausible.io/js/pa-M8H39gIN2J-TgmR4OOcVA.js"]') && typeof window.plausible === 'function'));
    ok('desktop: no phone bar', !(await p.isVisible('#mobile-cta')));
    await ctx.close(); }

  // ---------- phone: menu and sticky bar
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' }); await block(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/');
    ok('menu: closed at first', !(await p.isVisible('#nav')) && await p.getAttribute('#nav-toggle', 'aria-expanded') === 'false');
    ok('phone bar: hidden on the first screen', await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show')));
    await p.click('#nav-toggle'); await p.waitForTimeout(400);
    ok('menu: opens', await p.isVisible('#nav') && await p.getAttribute('#nav-toggle', 'aria-expanded') === 'true' && await p.getAttribute('#nav-toggle', 'aria-label') === 'Close menu');
    ok('menu: page behind is locked and inert', await p.evaluate(() => document.body.style.overflow === 'hidden' && document.querySelector('main').inert === true && document.querySelector('.skip-link').inert === true));
    ok('menu: focus moves to the first link', await p.evaluate(() => document.activeElement === document.querySelector('#nav a')));
    ok('menu: the top strip stays in view above the sheet', await p.evaluate(() => { const t = document.querySelector('.topbar-tel').getBoundingClientRect(); const e = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return !!e && !!e.closest('.topbar'); }));
    ok('menu: Call button is real text', (await p.textContent('.nav-foot')).includes('Call (225) 255-0837'));
    const targets = await p.evaluate(() => [...document.querySelectorAll('#nav a, #nav-toggle, #theme-toggle')].filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().height)));
    ok('menu: every target is at least 44px tall', targets.every(h => h >= 44), targets);
    for (let i = 0; i < 16; i++) await p.keyboard.press('Tab');
    ok('menu: Tab stays inside the header while open', await p.evaluate(() => !!document.activeElement.closest('.site-header') || document.activeElement === document.body));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    ok('menu: Escape closes and returns focus to the button', !(await p.isVisible('#nav')) && await p.evaluate(() => document.activeElement.id === 'nav-toggle' && document.body.style.overflow === '' && !document.querySelector('main').inert));
    await p.click('#nav-toggle'); await p.waitForTimeout(350);
    await Promise.all([p.waitForNavigation(), p.click('#nav a[href="/pricing/"]')]);
    ok('menu: a link navigates and the menu is closed on arrival', p.url().endsWith('/pricing/') && !(await p.isVisible('#nav')));
    ok('menu: current page is marked', await p.getAttribute('#nav a[href="/pricing/"]', 'aria-current') === 'page');
    await p.evaluate(() => scrollTo(0, 1400)); await p.waitForTimeout(500);
    ok('phone bar: shows after the first screen', await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show')) && await p.isVisible('#mobile-cta'));
    const bar = await p.evaluate(() => [...document.querySelectorAll('#mobile-cta a')].map(a => ({ t: a.textContent.trim().replace(/\s+/g, ' '), h: Math.round(a.getBoundingClientRect().height), href: a.getAttribute('href') })));
    ok('phone bar: labelled Call (tel:) beside the booking button, 50px or taller', bar.length === 2 && bar[0].t === 'Call' && bar[0].href === 'tel:+12252550837' && bar.every(x => x.h >= 50 && x.h <= 56), bar);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600);
    ok('phone bar: steps aside over the footer', await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show')));
    await ctx.close(); }

  // ---------- short screens, keyboard focus, late script
  { const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }); await block(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/'); await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(300);
    await p.click('#nav-toggle'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const list = document.querySelector('.nav-inner'); list.scrollTop = 9999;
      const head = document.querySelector('.header-inner').getBoundingClientRect().bottom, top = list.getBoundingClientRect().top, mail = document.querySelector('.nav-mail').getBoundingClientRect();
      return { scrolls: list.scrollTop > 0, sheet: document.getElementById('nav').scrollTop, clear: top >= head - 1, mailSeen: mail.bottom <= innerHeight + 1 }; });
    ok('menu on a short screen (375x667): the list scrolls under the header, not through it', r.scrolls && r.sheet === 0 && r.clear && r.mailSeen, r);
    await p.keyboard.press('Escape'); await p.click('#nav-toggle'); await p.waitForTimeout(300);
    ok('menu: reopens at the top of its list', await p.evaluate(() => document.querySelector('.nav-inner').scrollTop === 0));
    await ctx.close(); }
  for (const [w, h] of [[390, 844], [820, 1100]]) { const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); /* no smooth scrolling: measure where focus ends up */ await block(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/pricing/'); await p.waitForTimeout(300);
    let stops = 0, hidden = [];
    for (let i = 0; i < 90; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(120);
      const f = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const r = a.getBoundingClientRect(); const bar = document.getElementById('mobile-cta');
        const shown = bar.classList.contains('show'); const top = shown ? bar.getBoundingClientRect().top : innerHeight; return { label: (a.textContent || '').trim().slice(0, 30), under: !a.closest('#mobile-cta') && r.top >= top - 1, inFooter: !!a.closest('.site-footer') }; });
      if (!f) continue; stops++; if (f.under) hidden.push(f.label); if (f.inFooter) break; }
    ok(`focus: no tab stop on /pricing/ lands under the phone bar at ${w}px (${stops} stops)`, stops > 30 && hidden.length === 0, hidden);
    await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await block(ctx); await ctx.route(/\/assets\/js\/main\.js/, r => r.abort()); const p = await ctx.newPage();
    await p.goto(base + '/'); const before = await p.evaluate(() => document.documentElement.classList.contains('js'));
    await p.waitForTimeout(4400);
    const after = await p.evaluate(() => ({ js: document.documentElement.classList.contains('js'), faded: [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity === '0').length }));
    ok('late script: if main.js never starts, every reveal block is shown after four seconds', before && !after.js && after.faded === 0, after);
    await ctx.close(); }

  // ---------- contact form
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' }); await block(ctx);
    let posted = null;
    await ctx.route('https://api.web3forms.com/submit', r => { posted = r.request().postData() || ''; r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }); });
    const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/contact/?package=business');
    ok('contact: ?package= preselects the package', await p.inputValue('#package') === 'business');
    ok('contact: booking box is revealed', await p.evaluate(() => [...document.querySelectorAll('.booking-only')].every(e => !e.hidden)));
    ok('contact: no phone bar on this page', await p.evaluate(() => !document.getElementById('mobile-cta')));
    await p.click('#submit-btn');
    ok('contact: empty submit is stopped and says why', (await p.textContent('#form-status')).includes('Please fix the highlighted fields') && await p.evaluate(() => document.getElementById('form-status').classList.contains('error')));
    ok('contact: bad fields are marked for everyone', await p.evaluate(() => ['name', 'email', 'message'].every(id => { const f = document.getElementById(id); return f.classList.contains('invalid') && f.getAttribute('aria-invalid') === 'true' && document.getElementById(id + '-error').textContent.length > 0; })));
    ok('contact: focus moves to the first bad field', await p.evaluate(() => document.activeElement.id === 'name'));
    const ring = await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return [cs.outlineStyle, parseFloat(cs.outlineWidth)]; });
    ok('contact: focused field shows a real ring (2px or more)', ring[0] === 'solid' && ring[1] >= 2, ring);
    await p.fill('#name', 'Test Person'); await p.fill('#email', 'not-an-email'); await p.locator('#email').blur();
    ok('contact: email format is checked', (await p.textContent('#email-error')).includes('valid email'));
    await p.fill('#email', 'test@example.com'); await p.fill('#company', 'Test Co'); await p.fill('#message', 'A test enquiry with enough detail.');
    await p.check('input[name="services"][value="Automation"]', { force: true });
    await p.waitForTimeout(600);
    const draft = await p.evaluate(() => JSON.parse(localStorage.getItem('kws-enquiry-draft') || 'null'));
    ok('contact: draft saved as you type', draft && draft.name === 'Test Person' && draft.services.includes('Automation'), draft);
    await p.reload();
    ok('contact: draft restored after a reload', await p.inputValue('#name') === 'Test Person' && await p.isChecked('input[name="services"][value="Automation"]'));
    await p.locator('#message').focus(); await p.waitForTimeout(300);
    ok('contact: captcha is requested only once the form is used', await p.evaluate(() => !!document.querySelector('script[src^="https://js.hcaptcha.com/1/api.js?recaptchacompat=off"]')));
    await p.click('#submit-btn'); await p.waitForTimeout(600);
    ok('contact: sends to Web3Forms with the hidden fields', posted !== null && /access_key/.test(posted) && /from_name/.test(posted));
    ok('contact: success message, form cleared, draft cleared', (await p.textContent('#form-status')).includes('your enquiry is in') && await p.inputValue('#name') === '' && await p.evaluate(() => localStorage.getItem('kws-enquiry-draft') === null && document.getElementById('form-status').classList.contains('ok')));
    await ctx.close(); }

  // ---------- calculator, checkout, 404, /start/
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await block(ctx); const p = await ctx.newPage(); watch(p);
    await p.goto(base + '/consulting/');
    ok('calculator: default results match the page', await p.textContent('#r-month') === '$2,133');
    await p.fill('#c-calls', '10'); await p.waitForTimeout(100);
    ok('calculator: results follow the inputs', await p.textContent('#r-month') === '$3,867', await p.textContent('#r-month'));
    await p.goto(base + '/checkout/?plan=starter-deposit'); await p.waitForTimeout(400);
    ok('checkout: inline script runs and reports its state', (await p.textContent('#checkout-status')).length > 10);
    ok('checkout: no phone bar', await p.evaluate(() => !document.getElementById('mobile-cta')));
    await p.goto(base + '/checkout/success/'); await p.waitForTimeout(300);
    ok('checkout success: page and its script load', await p.isVisible('#success-title'));
    await p.goto(base + '/start/');
    ok('/start/: no menu, booking button in the header', await p.evaluate(() => !document.getElementById('nav') && !!document.querySelector('.site-header [data-booking]') && document.body.dataset.page === 'start'));
    await p.goto(base + '/404.html');
    ok('404: loads no script, shows the top strip and a way home', await p.evaluate(() => !document.querySelector('script[src]') && !!document.querySelector('.topbar-tel') && !!document.querySelector('main a[href="/"]')));
    await ctx.close(); }

  // ---------- without JavaScript
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, colorScheme: 'dark' }); const p = await ctx.newPage();
    await p.goto(base + '/');
    ok('no script: menu links sit in the page', await p.isVisible('#nav a[href="/pricing/"]'));
    ok('no script: dead buttons are hidden', !(await p.isVisible('#theme-toggle')) && !(await p.isVisible('#nav-toggle')));
    const hidden = await p.locator('.reveal').evaluateAll(els => els.filter(e => getComputedStyle(e).opacity !== '1').length);
    ok('no script: nothing is faded out', hidden === 0, hidden);
    ok('no script: a device set to dark still gets night (stylesheet only)', await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(19, 23, 34)');
    await ctx.close(); }

  ok('no console or page errors in any test', errors.length === 0, errors);
  await b.close();
  console.log(failed ? `\n${failed} check(s) failed` : '\nall behaviour checks passed');
  process.exit(failed ? 1 : 0);
})();
