const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
const out = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: 'light' });
    await block(ctx); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror ' + e)); p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type() + ' ' + m.text()); });
    p.on('requestfailed', r => { if (!/plausible|hcaptcha|calendly|stripe|onrender/.test(r.url())) errs.push('requestfailed ' + r.url()); });
    p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
    await p.goto(base + '/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(600);
    out(`\n=== ${w}x${h} ===`);
    // booking
    const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.textContent.trim().replace(/\s+/g,' ').slice(0, 30), a.href, a.target, a.rel, !!a.closest('main')]));
    out('booking links:', JSON.stringify(bk));
    // theme toggle
    const t0 = await p.getAttribute('html', 'data-theme'); await p.click('#theme-toggle'); const t1 = await p.getAttribute('html', 'data-theme');
    const bg1 = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); await p.click('#theme-toggle'); const t2 = await p.getAttribute('html', 'data-theme');
    out('theme:', t0, '->', t1, bg1, '->', t2);
    if (mobile) {
      out('menu closed first:', !(await p.isVisible('#nav')));
      await p.click('#nav-toggle'); await p.waitForTimeout(400);
      out('menu opens:', await p.isVisible('#nav'), await p.getAttribute('#nav-toggle', 'aria-expanded'), 'current:', await p.getAttribute('#nav a[href="/pricing/"]', 'aria-current'));
      await p.keyboard.press('Escape'); await p.waitForTimeout(400); out('menu closes:', !(await p.isVisible('#nav')));
      // sticky bar: when does it show, does it cover the last content/buttons
      const H = await p.evaluate(() => document.documentElement.scrollHeight); out('page height', H);
      const states = [];
      for (let y = 0; y <= H; y += 200) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(120);
        states.push(await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show') ? 1 : 0)); }
      out('bar show by 200px step:', states.join(''));
      // at each position where bar shows, is any focusable/CTA in main fully covered? Check the cta-band buttons when scrolled to the bottom of main
      await p.evaluate(() => document.querySelector('.cta-band .btn-row').scrollIntoView({ block: 'end' })); await p.waitForTimeout(700);
      out('cta band buttons vs bar:', JSON.stringify(await p.evaluate(() => { const bar = document.getElementById('mobile-cta'); const br = bar.getBoundingClientRect(); const shown = bar.classList.contains('show');
        return { shown, barTop: Math.round(br.top), vh: innerHeight, btns: [...document.querySelectorAll('.cta-band .btn')].map(a => { const r = a.getBoundingClientRect(); return [a.textContent.trim(), Math.round(r.top), Math.round(r.bottom)]; }) }; })));
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(700);
      out('at page bottom:', JSON.stringify(await p.evaluate(() => { const bar = document.getElementById('mobile-cta'); const last = document.querySelector('.footer-bottom').getBoundingClientRect(); return { shown: bar.classList.contains('show'), vis: getComputedStyle(bar).visibility, barTop: Math.round(bar.getBoundingClientRect().top), lastBottom: Math.round(last.bottom), vh: innerHeight }; })));
      // scroll to each in-main button and see whether the bar covers it when it is the natural bottom-most element (user scrolling): check last spec-act and care last row at scroll positions where element bottom is at viewport bottom
    } else {
      out('no phone bar on desktop:', !(await p.isVisible('#mobile-cta')));
      await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(700);
      out('header scrolled:', await p.evaluate(() => document.getElementById('site-header').classList.contains('scrolled')), 'tel visible:', await p.isVisible('.header-tel'));
    }
    // toc anchors: click each and check the target lands below the sticky header
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    for (const id of ['packages', 'payment', 'addons', 'consulting', 'care']) {
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
      await p.click(`.toc a[href="#${id}"]`); await p.waitForTimeout(350);
      const r = await p.evaluate(id => { const t = document.getElementById(id).getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect(); return { top: Math.round(t.top), headerBottom: Math.round(hd.bottom), hash: location.hash }; }, id);
      out(`toc #${id}:`, JSON.stringify(r), r.top >= r.headerBottom ? 'clear of header' : 'UNDER HEADER');
    }
    out('console/network problems:', JSON.stringify(errs));
    await ctx.close();
  }
  // checkout + contact arrivals from pricing links
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await block(ctx); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror ' + e));
    for (const plan of ['starter-deposit', 'business-deposit', 'commerce-deposit', 'essential-care', 'growth-care', 'commerce-care']) {
      await p.goto(base + '/pricing/'); await p.waitForTimeout(200);
      const sel = `main a[href="/checkout/?plan=${plan}"]`;
      await p.locator(sel).scrollIntoViewIfNeeded(); await Promise.all([p.waitForNavigation(), p.locator(sel).click()]); await p.waitForTimeout(900);
      out('checkout', plan, '->', p.url().replace(base, ''), '|', JSON.stringify(await p.evaluate(() => ({ name: document.getElementById('checkout-plan-name') && document.getElementById('checkout-plan-name').textContent, price: document.getElementById('checkout-plan-price') && document.getElementById('checkout-plan-price').textContent, hidden: document.getElementById('checkout-plan') && document.getElementById('checkout-plan').hidden, status: (document.getElementById('checkout-status') || {}).textContent }))));
    }
    for (const pk of ['onepage', 'starter', 'business', 'commerce', 'check', 'audit', 'bundle', 'care']) {
      await p.goto(base + '/pricing/'); await p.waitForTimeout(150);
      const sel = `main a[href="/contact/?package=${pk}"]`;
      await p.locator(sel).first().scrollIntoViewIfNeeded(); await Promise.all([p.waitForNavigation(), p.locator(sel).first().click()]); await p.waitForTimeout(300);
      out('contact', pk, '->', p.url().replace(base, ''), 'select =', await p.inputValue('#package'), '|', await p.evaluate(() => document.querySelector('#package').selectedOptions[0].textContent.trim()));
    }
    out('errors:', JSON.stringify(errs)); await ctx.close(); }
  await b.close();
})();
