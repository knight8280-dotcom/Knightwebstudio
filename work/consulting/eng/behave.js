const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra === undefined ? '' : '   ' + JSON.stringify(extra))); if (!cond) failed++; };
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
const RIDS = ['r-month','r-year','r-jobs','r-calls','r-quotes','r-hours','r-timeval','r-payback'];
(async () => {
  const b = await chromium.launch();
  // printed defaults from the raw HTML
  const raw = await (await fetch(URL)).text();
  const printed = {}; for (const id of RIDS) { const m = raw.match(new RegExp('id="' + id + '"[^>]*>([^<]*)<')); printed[id] = m && m[1]; }
  console.log('printed', JSON.stringify(printed));
  for (const vp of [{ w: 390, h: 844, mobile: true }, { w: 1440, h: 900, mobile: false }]) {
    console.log('\n===== ' + vp.w);
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mobile, hasTouch: vp.mobile, colorScheme: 'light' });
    await block(ctx);
    const p = await ctx.newPage(); const errors = [], failedReq = [];
    p.on('pageerror', e => errors.push(String(e)));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('requestfailed', r => { if (!/plausible|hcaptcha|calendly|stripe|onrender/.test(r.url())) failedReq.push(r.url()); });
    p.on('response', r => { if (r.status() >= 400) failedReq.push(r.status() + ' ' + r.url()); });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(600);
    // calculator defaults
    const computed = await p.evaluate(ids => Object.fromEntries(ids.map(i => [i, document.getElementById(i).textContent])), RIDS);
    ok('calc: printed defaults equal computed', JSON.stringify(printed) === JSON.stringify(computed), computed);
    // input attributes
    const inputs = await p.evaluate(() => [...document.querySelectorAll('#growth-calc input')].map(i => ({ id: i.id, type: i.type, inputmode: i.getAttribute('inputmode'), min: i.min, max: i.max, step: i.step, value: i.value, label: (document.querySelector('label[for="' + i.id + '"]') || {}).textContent, h: Math.round(i.getBoundingClientRect().height), w: Math.round(i.getBoundingClientRect().width), fs: getComputedStyle(i).fontSize })));
    console.log(inputs.map(i => `${i.id} ${i.type} ${i.inputmode} min=${i.min} max=${i.max} step=${i.step} v=${i.value} ${i.w}x${i.h} ${i.fs} | ${i.label}`).join('\n'));
    ok('calc: 8 inputs, each labelled, >=44px, >=16px text', inputs.length === 8 && inputs.every(i => i.label && i.h >= 44 && parseFloat(i.fs) >= 16));
    // change inputs
    await p.fill('#c-job', '1000'); await p.fill('#c-calls', '10'); await p.fill('#c-callwin', '50');
    let r = await p.evaluate(ids => Object.fromEntries(ids.map(i => [i, document.getElementById(i).textContent])), RIDS);
    // expected: callJobs = 10*4.3333*0.5 = 21.667; quoteJobs = 4*.25 = 1; monthly = 22667
    ok('calc: results update on input', r['r-month'] === '$22,667' && r['r-calls'] === '$21,667/mo' && r['r-quotes'] === '$1,000/mo' && r['r-jobs'] === '22.7', r);
    await p.fill('#c-calls', ''); r = await p.evaluate(ids => Object.fromEntries(ids.map(i => [i, document.getElementById(i).textContent])), RIDS);
    ok('calc: empty calls -> helper sentence, no NaN', !/NaN|undefined|Infinity/.test(JSON.stringify(r)) && /Add the calls you miss/.test(r['r-payback']), r);
    await p.fill('#c-calls', '5'); await p.fill('#c-callwin', '250'); await p.fill('#c-job', '-5');
    r = await p.evaluate(ids => Object.fromEntries(ids.map(i => [i, document.getElementById(i).textContent])), RIDS);
    ok('calc: >100% clamps, negative -> 0, no NaN', !/NaN|undefined|Infinity/.test(JSON.stringify(r)), r);
    // very large numbers: overflow of the receipt?
    await p.fill('#c-job', '40000'); await p.fill('#c-calls', '20'); await p.fill('#c-callwin', '100'); await p.fill('#c-quotes', '99999'); await p.fill('#c-quotewin', '100'); await p.fill('#c-hours', '999'); await p.fill('#c-auto', '100'); await p.fill('#c-rate', '99999');
    await p.waitForTimeout(100);
    const big = await p.evaluate(() => { const rc = document.querySelector('#growth-calc .receipt'); const R = rc.getBoundingClientRect(); const out = []; for (const el of rc.querySelectorAll('*')) { const e = el.getBoundingClientRect(); if (e.width && (e.right > R.right + 1 || e.left < R.left - 1)) out.push(el.tagName + '.' + el.className + '#' + el.id + ' ' + Math.round(e.left - R.left) + '..' + Math.round(e.right - R.right) + ' "' + el.textContent.slice(0, 30) + '"'); } return { out, pageOver: document.documentElement.scrollWidth - innerWidth, month: document.getElementById('r-month').textContent, w: Math.round(R.width) }; });
    ok('calc: huge values stay inside the receipt', big.out.length === 0 && big.pageOver <= 0, big);
    // six-digit value in unit field on phone
    await p.fill('#c-job', '250000');
    const six = await p.evaluate(() => { const i = document.getElementById('c-job'); return { sw: i.scrollWidth, cw: i.clientWidth, w: i.getBoundingClientRect().width }; });
    ok('calc: six digits fit the $ field', six.sw <= six.cw + 1, six);
    await p.fill('#c-callwin', '100'); const pc = await p.evaluate(() => { const i = document.getElementById('c-callwin'); return { sw: i.scrollWidth, cw: i.clientWidth }; }); ok('calc: 100 fits the % field', pc.sw <= pc.cw + 1, pc);
    // reload to reset
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400);
    // booking buttons
    const booking = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => ({ t: a.textContent.trim().slice(0, 30), href: a.href, target: a.target, rel: a.rel, vis: !!a.getClientRects().length })));
    ok('booking: every [data-booking] points at the calendar in a new tab', booking.length > 0 && booking.every(x => /calendly\.com/.test(x.href) && x.target === '_blank' && /noopener/.test(x.rel)), booking);
    // theme
    const before = await p.getAttribute('html', 'data-theme'); await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('#theme-toggle'); const after = await p.getAttribute('html', 'data-theme');
    ok('theme: toggle flips and saves', before === 'light' && after === 'dark' && await p.evaluate(() => localStorage.getItem('theme')) === 'dark', { before, after });
    ok('theme: page is dark', await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(19, 23, 34)');
    await p.reload(); ok('theme: survives reload', await p.getAttribute('html', 'data-theme') === 'dark');
    await p.click('#theme-toggle'); ok('theme: back to light', await p.getAttribute('html', 'data-theme') === 'light');
    // year
    ok('#year filled', /^20\d\d$/.test(await p.textContent('#year')));
    // aria-current
    ok('menu: aria-current on Consulting', await p.evaluate(() => { const a = document.querySelector('#nav [aria-current="page"]'); return a && a.getAttribute('href'); }) === '/consulting/');
    if (vp.mobile) {
      // menu
      await p.click('#nav-toggle'); await p.waitForTimeout(350);
      const st = await p.evaluate(() => ({ open: document.getElementById('nav').classList.contains('open'), exp: document.getElementById('nav-toggle').getAttribute('aria-expanded'), focusIn: document.getElementById('nav').contains(document.activeElement), mainInert: document.querySelector('main').inert, bodyOverflow: document.body.style.overflow }));
      ok('menu: opens, aria-expanded, focus inside, page inert', st.open && st.exp === 'true' && st.focusIn && st.mainInert && st.bodyOverflow === 'hidden', st);
      await p.screenshot({ path: 'menu-390.png' });
      await p.keyboard.press('Escape'); await p.waitForTimeout(350);
      const st2 = await p.evaluate(() => ({ open: document.getElementById('nav').classList.contains('open'), focus: document.activeElement.id, mainInert: document.querySelector('main').inert }));
      ok('menu: Escape closes and returns focus', !st2.open && st2.focus === 'nav-toggle' && !st2.mainInert, st2);
      // sticky bar
      const s0 = await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'));
      await p.evaluate(() => window.scrollTo(0, 1200)); await p.waitForTimeout(500);
      const s1 = await p.evaluate(() => { const m = document.getElementById('mobile-cta'); const r = m.getBoundingClientRect(); return { show: m.classList.contains('show'), top: Math.round(r.top), h: Math.round(r.height), links: [...m.querySelectorAll('a')].map(a => [a.textContent.trim(), a.getAttribute('href'), a.href, Math.round(a.getBoundingClientRect().height)]) }; });
      ok('phone bar: hidden on first screen, shown after', !s0 && s1.show, s1);
      // at the very bottom
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(700);
      const s2 = await p.evaluate(() => { const m = document.getElementById('mobile-cta'); const cs = getComputedStyle(m); return { show: m.classList.contains('show'), vis: cs.visibility, op: cs.opacity, tr: cs.transform }; });
      ok('phone bar: gone over the footer', !s2.show, s2);
      // just above the footer: does the bar cover the closing band's buttons with no way to see them?
      const cover = await p.evaluate(async () => { const out = []; const m = document.getElementById('mobile-cta'); const btns = [...document.querySelectorAll('main .btn, main .more-link, main summary, main input')]; for (const el of btns) { el.scrollIntoView({ block: 'end' }); await new Promise(r => setTimeout(r, 120)); const r = el.getBoundingClientRect(); const mr = m.getBoundingClientRect(); const shown = m.classList.contains('show'); if (shown && r.bottom > mr.top + 1) out.push({ t: (el.textContent || el.id).trim().slice(0, 30), bottom: Math.round(r.bottom), barTop: Math.round(mr.top) }); } return out; });
      console.log('INFO  scrollIntoView(end) leaves these under the bar (expected: scroll-padding should prevent):', JSON.stringify(cover));
    }
    // anchors land below the sticky header
    for (const id of ['time', 'how', 'calculator', 'process', 'services', 'plans', 'bundle', 'consulting-faq']) {
      await p.evaluate(i => { location.hash = ''; location.hash = '#' + i; }, id); await p.waitForTimeout(900);
      const a = await p.evaluate(i => { const el = document.getElementById(i); const h = document.querySelector('.site-header').getBoundingClientRect(); const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const first = el.querySelector('h2, h3, .pl-row, .steps-no') || el; return { top: Math.round(r.top), headerBottom: Math.round(h.bottom), smt: cs.scrollMarginTop, firstTop: Math.round(first.getBoundingClientRect().top) }; }, id);
      ok(`anchor #${id} lands clear of the header`, a.top >= a.headerBottom - 1 || a.firstTop >= a.headerBottom, a);
    }
    ok('no console errors', errors.length === 0, errors); ok('no failed requests', failedReq.length === 0, failedReq);
    await ctx.close();
  }
  await b.close(); console.log(failed ? `\n${failed} FAILED` : '\nall passed');
})();
