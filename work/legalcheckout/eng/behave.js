const { chromium, open, S, json, SID } = require('./lib.js');
const base = 'http://localhost:8720';
const ok = (c, m, extra) => console.log((c ? 'PASS  ' : 'FAIL  ') + m + (extra ? '  [' + extra + ']' : ''));
(async () => {
  const browser = await chromium.launch();
  // 1. pricing page links into checkout
  { const { ctx, page } = await open(browser, { url: '/pricing/' }, 'd-light');
    await page.goto(base + '/pricing/'); await page.waitForTimeout(500);
    const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/checkout/"]')].map(a => a.getAttribute('href')))]);
    console.log('pricing -> checkout links:', links.join(' '));
    for (const href of links) { const p2 = await ctx.newPage(); await p2.goto(base + href); await p2.waitForTimeout(600);
      const r = await p2.evaluate(() => ({ shown: !document.getElementById('checkout-plan').hidden, name: document.getElementById('checkout-plan-name').textContent, price: document.getElementById('checkout-plan-price').textContent }));
      ok(r.shown && r.name && r.price, 'checkout ' + href + ' shows the order slip', r.name + ' ' + r.price); await p2.close(); }
    // other pages that link to checkout or to legal anchors
    await ctx.close(); }
  for (const view of ['m-light', 'd-light']) for (const path of ['/privacy/', '/terms/', '/checkout/?plan=starter-deposit', '/checkout/success/?plan=starter-deposit']) {
    const s = { url: path, stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) };
    const { ctx, page, errors } = await open(browser, s, view, { noThemeStore: true });
    await page.goto(base + path, { waitUntil: 'load' }); await page.waitForTimeout(800);
    const tag = path + ' ' + view + ': ';
    // theme toggle
    const t0 = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.click('#theme-toggle'); await page.waitForTimeout(150);
    const t1 = await page.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem('theme'), getComputedStyle(document.body).backgroundColor, document.getElementById('theme-toggle').getAttribute('aria-label') || document.getElementById('theme-toggle').getAttribute('aria-pressed')]);
    ok(t0 === 'light' && t1[0] === 'dark' && t1[1] === 'dark', tag + 'theme toggle flips and saves', t0 + ' -> ' + t1.join(' / '));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(500);
    const t2 = await page.evaluate(() => document.documentElement.dataset.theme); ok(t2 === 'dark', tag + 'saved theme survives a reload', t2);
    await page.click('#theme-toggle'); await page.waitForTimeout(100);
    // menu on phone
    if (view === 'm-light') {
      await page.click('#nav-toggle'); await page.waitForTimeout(400);
      const m1 = await page.evaluate(() => [document.getElementById('nav-toggle').getAttribute('aria-expanded'), getComputedStyle(document.getElementById('nav')).visibility, document.querySelectorAll('#nav a').length]);
      ok(m1[0] === 'true' && m1[1] === 'visible', tag + 'phone menu opens', m1.join(' / '));
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      const m2 = await page.evaluate(() => [document.getElementById('nav-toggle').getAttribute('aria-expanded'), getComputedStyle(document.getElementById('nav')).visibility]);
      ok(m2[0] === 'false' && m2[1] === 'hidden', tag + 'Escape closes the menu', m2.join(' / '));
    }
    const misc = await page.evaluate(() => ({ year: document.getElementById('year') && document.getElementById('year').textContent, cta: !!document.getElementById('mobile-cta'), booking: [...document.querySelectorAll('[data-booking]')].map(a => a.getAttribute('href') + '|' + a.target + '|' + a.rel), ready: !!window.kwsReady, js: document.documentElement.classList.contains('js') }));
    ok(misc.year === String(new Date().getFullYear()), tag + '#year is the current year', misc.year);
    ok(!misc.cta, tag + 'no sticky phone bar');
    ok(misc.booking.length && misc.booking.every(b => /calendly\.com/.test(b) && /_blank/.test(b) && /noopener/.test(b)), tag + 'booking buttons point at the calendar in a new tab', misc.booking.join(' ; '));
    await page.evaluate(() => scrollTo(0, 600)); await page.waitForTimeout(300);
    const sc = await page.evaluate(() => document.getElementById('site-header').classList.contains('scrolled')); ok(sc, tag + 'header gets its scrolled state');
    const perr = errors.filter(e => /PAGEERROR/.test(e)); ok(!perr.length, tag + 'no page errors', perr.join(' | '));
    await ctx.close();
  }
  // confirm flow: a successful confirm goes to the success page with plan and session id; an error result stays
  for (const result of ['success', 'error']) {
    const s = { url: '/checkout/?plan=business-deposit', stripe: 'loaded', server: json({ client_secret: 'x', session_id: SID }) };
    const { ctx, page } = await open(browser, s, 'm-light');
    await page.goto(base + s.url, { waitUntil: 'load' }); await page.waitForTimeout(900);
    await page.evaluate(r => { window.__confirmResult = { type: r }; window.__fireConfirm(); }, result);
    await page.waitForTimeout(1200);
    const u = page.url();
    if (result === 'success') ok(/\/checkout\/success\/\?plan=business-deposit&session_id=cs_test_/.test(u), 'confirm success -> success page with plan and session id', u.replace(base, ''));
    else ok(/\/checkout\/\?plan=business-deposit$/.test(u), 'confirm error stays on checkout', u.replace(base, ''));
    await ctx.close();
  }
  // retry link from "not completed" goes back to checkout with the plan
  { const { ctx, page } = await open(browser, S['ok-unpaid'], 'm-light'); await page.goto(base + S['ok-unpaid'].url); await page.waitForTimeout(900);
    const href = await page.getAttribute('#success-retry', 'href'); ok(href === '/checkout/?plan=commerce-deposit', 'retry button returns to checkout with the plan', href); await ctx.close(); }
  // TOC anchors: click each, heading must be visible below the sticky header
  for (const view of ['m-light', 'd-light']) for (const path of ['/privacy/', '/terms/']) {
    const { ctx, page } = await open(browser, { url: path }, view, { rm: 'reduce' });
    await page.goto(base + path); await page.waitForTimeout(600);
    const n = await page.evaluate(() => document.querySelectorAll('.toc a').length); const bad = [];
    for (let i = 0; i < n; i++) {
      await page.evaluate(i => { scrollTo(0, 0); document.querySelectorAll('.toc a')[i].click(); }, i); await page.waitForTimeout(120);
      const r = await page.evaluate(i => { const a = document.querySelectorAll('.toc a')[i]; const t = document.getElementById(a.getAttribute('href').slice(1)); const hb = document.querySelector('.site-header').getBoundingClientRect().bottom; const tr = t.getBoundingClientRect(); return { id: t.id, top: Math.round(tr.top), hb: Math.round(hb), vh: innerHeight, tag: t.tagName, matches: t.textContent.trim() === a.textContent.trim() }; }, i);
      if (!(r.top >= r.hb && r.top < r.vh - 40) || !r.matches) bad.push(JSON.stringify(r));
    }
    ok(!bad.length, path + ' ' + view + ': all ' + n + ' contents links land their heading clear of the sticky header', bad.join(' ').slice(0, 300));
    await ctx.close();
  }
  await browser.close();
})();
