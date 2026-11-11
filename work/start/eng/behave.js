const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844, m: true }, { width: 820, height: 1180, m: true }, { width: 1440, height: 900, m: false }]) {
    log(`\n===== ${vp.width}x${vp.height}`);
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.m, hasTouch: vp.m });
    const reqs = [];
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => { reqs.push(r.request().url()); r.abort(); });
    const p = await ctx.newPage();
    const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    const failed = []; p.on('requestfailed', r => { if (!/plausible|hcaptcha|calendly|stripe|onrender/.test(r.url())) failed.push(r.url()); });
    const resp404 = []; p.on('response', r => { if (r.status() >= 400) resp404.push(r.status() + ' ' + r.url()); });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(600);
    // booking buttons
    const book = await p.$$eval('[data-booking]', els => els.map(a => ({ t: a.textContent.trim().slice(0, 30), href: a.href, target: a.target, rel: a.rel, vis: !!(a.offsetWidth || a.offsetHeight) })));
    log('booking buttons:', JSON.stringify(book));
    log('tel links:', JSON.stringify(await p.$$eval('a[href^="tel:"]', els => els.map(a => ({ t: a.textContent.trim().replace(/\s+/g, ' '), href: a.getAttribute('href'), vis: !!(a.offsetWidth || a.offsetHeight), aria: a.getAttribute('aria-label') })))));
    // theme toggle
    const t0 = await p.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor, document.getElementById('theme-toggle').getAttribute('aria-label'), document.querySelector('meta[name=theme-color]').content]);
    await p.click('#theme-toggle'); await p.waitForTimeout(150);
    const t1 = await p.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor, document.getElementById('theme-toggle').getAttribute('aria-label'), document.querySelector('meta[name=theme-color]').content, localStorage.getItem('theme')]);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    const t2 = await p.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.body).backgroundColor]);
    await p.click('#theme-toggle'); await p.waitForTimeout(150);
    const t3 = await p.evaluate(() => [document.documentElement.dataset.theme, localStorage.getItem('theme')]);
    log('theme:', JSON.stringify({ t0, t1, t2, t3 }));
    // menu absent
    log('nav-toggle present:', await p.$('#nav-toggle') !== null, ' nav present:', await p.$('#nav') !== null);
    // header scroll state / year
    log('year:', await p.$eval('#year', e => e.textContent));
    // phone bar: scroll through the page and log state + what is beneath it
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    const states = [];
    for (let y = 0; y <= H - vp.height + 5; y += 60) {
      await p.evaluate(yy => window.scrollTo(0, yy), y); await p.waitForTimeout(90);
      const s = await p.evaluate(() => {
        const bar = document.getElementById('mobile-cta'); const cs = getComputedStyle(bar);
        const shown = bar.classList.contains('show') && cs.display !== 'none';
        const r = bar.getBoundingClientRect();
        const c = document.getElementById('contact').getBoundingClientRect(); const f = document.querySelector('.site-footer').getBoundingClientRect();
        return { shown, top: Math.round(r.top), h: Math.round(r.height), contactTop: Math.round(c.top), footerTop: Math.round(f.top), scrolled: document.getElementById('site-header').classList.contains('scrolled') };
      });
      states.push({ y, ...s });
    }
    const trans = states.filter((s, i) => i === 0 || s.shown !== states[i - 1].shown);
    log('phone bar transitions:', JSON.stringify(trans));
    log('bar display at this width:', await p.evaluate(() => getComputedStyle(document.getElementById('mobile-cta')).display), 'scrolled-class at end:', states[states.length - 1].scrolled);
    // when the bar is shown, is any interactive element under it at rest positions where the element cannot be scrolled clear? Check last content before the closing band
    if (vp.m) {
      // find scroll pos where bar is shown and the closing band top is just below viewport
      const last = [...states].reverse().find(s => s.shown);
      log('last shown state:', JSON.stringify(last));
      await p.evaluate(yy => window.scrollTo(0, yy), last.y); await p.waitForTimeout(400);
      await p.screenshot({ path: `work/start/eng/bar-last-${vp.width}.png` });
      // at bottom of page
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
      const end = await p.evaluate(() => { const bar = document.getElementById('mobile-cta'); return { show: bar.classList.contains('show'), vis: getComputedStyle(bar).visibility, top: Math.round(bar.getBoundingClientRect().top), vh: innerHeight }; });
      log('bar at page end:', JSON.stringify(end));
      await p.screenshot({ path: `work/start/eng/bar-end-${vp.width}.png` });
    }
    // in-page anchor
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
    await p.click('a.price-strip'); await p.waitForTimeout(1200);
    log('after price-strip click: hash', await p.evaluate(() => location.hash), 'pricing top', await p.evaluate(() => Math.round(document.getElementById('pricing').getBoundingClientRect().top)), 'header h', await p.evaluate(() => Math.round(document.getElementById('site-header').getBoundingClientRect().bottom)));
    // reveal: all visible after scrolling
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); await p.waitForTimeout(900);
    log('reveal not visible after full scroll:', JSON.stringify(await p.$$eval('.reveal', els => els.filter(e => getComputedStyle(e).opacity !== '1').map(e => e.className))));
    log('seq not visible:', JSON.stringify(await p.$$eval('.seq', els => els.filter(e => getComputedStyle(e).opacity !== '1').length)));
    log('console errors:', JSON.stringify(errs), 'failed:', JSON.stringify(failed), '4xx:', JSON.stringify(resp404));
    log('third-party requests attempted:', JSON.stringify([...new Set(reqs)]));
    await ctx.close();
  }
  await b.close();
})();
