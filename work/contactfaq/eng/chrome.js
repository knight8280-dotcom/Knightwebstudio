const { chromium } = require('/opt/node-tools/node_modules/playwright');
let failed = 0; const ok = (n, c, x) => { console.log((c ? 'PASS  ' : 'FAIL  ') + n + (x === undefined || c ? '' : ' ' + JSON.stringify(x))); if (!c) failed++; };
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const errs = []; const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 500, hasTouch: w < 500 }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load/.test(m.text())) errs.push(m.text()); });
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(300); const t = `${path} ${w}`;
    ok(`${t} light by default`, await p.getAttribute('html', 'data-theme') === 'light');
    await p.click('#theme-toggle'); ok(`${t} toggle -> dark, saved, label`, await p.getAttribute('html', 'data-theme') === 'dark' && await p.evaluate(() => localStorage.getItem('theme')) === 'dark' && await p.getAttribute('#theme-toggle', 'aria-label') === 'Switch to light theme' && await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(19, 23, 34)');
    await p.reload(); ok(`${t} dark persists after reload`, await p.getAttribute('html', 'data-theme') === 'dark'); await p.click('#theme-toggle');
    ok(`${t} aria-current on the right menu link`, await p.evaluate(pa => { const c = [...document.querySelectorAll('#nav [aria-current="page"]')]; return c.length === 1 && c[0].getAttribute('href') === pa; }, path));
    ok(`${t} year`, await p.textContent('#year') === String(new Date().getFullYear()));
    ok(`${t} plausible queued`, await p.evaluate(() => !!document.querySelector('script[src*="plausible.io/js/pa-"]')));
    const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.href, a.target, a.rel])); ok(`${t} booking links (${bk.length})`, bk.length > 0 && bk.every(x => x[0].startsWith('https://calendly.com/') && x[1] === '_blank' && x[2] === 'noopener'), bk);
    if (w < 1100) { await p.click('#nav-toggle'); await p.waitForTimeout(400); ok(`${t} menu opens`, await p.isVisible('#nav') && await p.getAttribute('#nav-toggle', 'aria-expanded') === 'true' && await p.evaluate(() => document.querySelector('main').inert)); await p.keyboard.press('Escape'); await p.waitForTimeout(400); ok(`${t} menu closes on Escape`, !(await p.isVisible('#nav')) && await p.evaluate(() => !document.querySelector('main').inert && document.body.style.overflow === ''));
      const bar = await p.evaluate(() => !!document.getElementById('mobile-cta')); ok(`${t} phone bar ${path === '/contact/' ? 'absent' : 'present'}`, path === '/contact/' ? !bar : bar);
      if (bar) { await p.evaluate(() => scrollTo({ top: 900, behavior: 'instant' })); await p.waitForTimeout(500); ok(`${t} phone bar shows after first screen`, await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'))); await p.evaluate(() => scrollTo({ top: 99999, behavior: 'instant' })); await p.waitForTimeout(600); ok(`${t} phone bar hides at the end of the page`, await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show'))); } }
    else { await p.evaluate(() => scrollTo({ top: 600, behavior: 'instant' })); await p.waitForTimeout(700); ok(`${t} header scrolled + header phone visible`, await p.evaluate(() => document.getElementById('site-header').classList.contains('scrolled')) && await p.isVisible('.header-tel')); }
    ok(`${t} no console errors`, errs.length === 0, errs); await ctx.close();
  }
  await b.close(); console.log(failed ? failed + ' FAILED' : 'all passed');
})();
