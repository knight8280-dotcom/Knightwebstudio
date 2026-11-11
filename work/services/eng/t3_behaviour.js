const { chromium } = require('playwright');
const URL = 'http://localhost:8720/services/';
const out = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844, mobile: true }, { width: 1440, height: 900 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror ' + e)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
    p.on('requestfailed', r => { if (!/plausible|calendly/.test(r.url())) errs.push('requestfailed ' + r.url()); });
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await p.goto(URL); await p.waitForTimeout(500);
    out(`\n===== ${vp.width}x${vp.height}`);
    // booking
    const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.textContent.trim().replace(/\s+/g, ' '), a.href, a.target, a.rel, a.getAttribute('aria-label')]));
    out('booking buttons:', JSON.stringify(bk));
    // theme toggle
    const t0 = await p.getAttribute('html', 'data-theme'); await p.click('#theme-toggle'); const t1 = await p.getAttribute('html', 'data-theme');
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); await p.click('#theme-toggle'); const t2 = await p.getAttribute('html', 'data-theme');
    out('theme', t0, '->', t1, bg, '->', t2);
    // phone menu
    if (vp.mobile) {
      await p.click('#nav-toggle'); await p.waitForTimeout(400);
      out('menu open:', await p.isVisible('#nav'), await p.getAttribute('#nav-toggle', 'aria-expanded'), 'aria-current:', await p.evaluate(() => document.querySelector('#nav [aria-current]')?.textContent));
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      out('menu closed by Escape:', !(await p.isVisible('#nav')), await p.getAttribute('#nav-toggle', 'aria-expanded'));
    }
    // sticky bar across the scroll
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    const samples = [];
    for (let y = 0; y <= H - vp.height + 1; y += Math.round(vp.height * 0.5)) {
      await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(350);
      const s = await p.evaluate(() => { const m = document.getElementById('mobile-cta'); if (!m) return null; const cs = getComputedStyle(m); const r = m.getBoundingClientRect(); return { show: m.classList.contains('show'), vis: cs.visibility, top: Math.round(r.top), h: Math.round(r.height), disp: cs.display }; });
      samples.push(`${y}:${s ? (s.disp === 'none' ? 'none' : (s.show ? 'SHOW@' + s.top + '/' + s.h : 'hidden')) : 'absent'}`);
    }
    await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await p.waitForTimeout(500);
    const end = await p.evaluate(() => { const m = document.getElementById('mobile-cta'); const cs = getComputedStyle(m); const r = m.getBoundingClientRect(); const last = [...document.querySelectorAll('.footer-links a, .footer-bottom p')].map(e => { const q = e.getBoundingClientRect(); return [e.textContent.trim().slice(0, 20), Math.round(q.top), Math.round(q.bottom)]; }); return { show: m.classList.contains('show'), vis: cs.visibility, disp: cs.display, barTop: Math.round(r.top), vh: innerHeight, last }; });
    out('page height', H, 'sticky bar samples:', samples.join('  '));
    out('at page end:', JSON.stringify(end));
    // menu links
    const hrefs = await p.evaluate(() => [...document.querySelectorAll('.menu a, a.price-strip')].map(a => a.getAttribute('href')));
    for (const h of hrefs) {
      await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(150);
      await p.evaluate(hh => { document.querySelector(`a[href="${hh}"]`).click(); }, h);
      await p.waitForTimeout(1200);
      const r = await p.evaluate(hh => { const t = document.getElementById(hh.slice(1)); const hd = document.getElementById('site-header').getBoundingClientRect(); const rc = t.getBoundingClientRect();
        const firstText = t.matches('details') ? t.querySelector('summary') : (t.querySelector('h2,h3') || t); const fr = firstText.getBoundingClientRect();
        const bar = document.getElementById('mobile-cta'); const br = bar && getComputedStyle(bar).display !== 'none' && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight;
        return { hash: location.hash, headerBottom: Math.round(hd.bottom), targetTop: Math.round(rc.top), firstTextTop: Math.round(fr.top), firstTextBottom: Math.round(fr.bottom), barTop: Math.round(br), isDetails: t.matches('details'), open: t.matches('details') ? t.open : null, scrollY: Math.round(scrollY), maxY: document.documentElement.scrollHeight - innerHeight }; }, h);
      out(`  ${h.padEnd(20)} headerBottom ${r.headerBottom} targetTop ${r.targetTop} first text ${r.firstTextTop}-${r.firstTextBottom} barTop ${r.barTop} ${r.isDetails ? (r.open ? 'details OPEN' : 'details CLOSED') : ''} ${r.firstTextTop < r.headerBottom ? '<<< UNDER HEADER' : ''}${r.firstTextBottom > r.barTop ? '<<< UNDER BAR' : ''}`);
    }
    // details toggle by click and keyboard
    const det = await p.evaluate(() => [...document.querySelectorAll('main details')].map(d => [d.id, d.open]));
    out('details initial:', JSON.stringify(det));
    await p.goto(URL + '#ecommerce'); await p.waitForTimeout(800);
    out('deep link #ecommerce open?', await p.evaluate(() => document.getElementById('ecommerce').open), 'target underline:', await p.evaluate(() => getComputedStyle(document.querySelector('#ecommerce .pl-name')).textDecorationLine + ' ' + getComputedStyle(document.querySelector('#ecommerce .pl-name')).textDecorationColor));
    await p.locator('#ecommerce summary').click(); await p.waitForTimeout(200);
    out('click summary -> open', await p.evaluate(() => document.getElementById('ecommerce').open));
    await p.locator('#brand summary').focus(); await p.keyboard.press('Enter'); const e1 = await p.evaluate(() => document.getElementById('brand').open); await p.keyboard.press('Space'); const e2 = await p.evaluate(() => document.getElementById('brand').open);
    out('keyboard Enter opens', e1, 'Space closes', !e2);
    out('ERRORS:', errs.length ? errs : 'none');
    await ctx.close();
  }
  await b.close();
})();
