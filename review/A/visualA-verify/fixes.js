// Try the proposed fixes in the browser only (nothing in the repository is touched) and measure the result.
const { open, done, close, shotEl } = require('./lib');
const path = require('path');
const OUT = __dirname;
const R = v => Math.round(v * 10) / 10;
const css = (page, text) => page.addStyleTag({ content: text });
(async () => {
  // ---- VA-06: all buttons in main at 390 on every page: which do not fill their column?
  const all = ['/', '/start/', '/pricing/', '/consulting/', '/services/', '/work/', '/process/', '/faq/', '/contact/', '/about/', '/web-design-baton-rouge/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
  for (const p of all) {
    const page = await open(p, 390);
    const r = await page.evaluate(() => [...document.querySelectorAll('main .btn')].filter(b => b.offsetParent).map(b => {
      const par = b.parentElement; const pcs = getComputedStyle(par); const avail = par.clientWidth - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
      const bw = b.getBoundingClientRect().width;
      return { t: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), w: Math.round(bw), avail: Math.round(avail), cls: b.className, parent: par.className.split(' ').slice(0, 2).join('.') };
    }).filter(x => x.w < x.avail - 4));
    console.log('VA-06 not-full-width@390', p, JSON.stringify(r));
    await done(page);
  }

  // ---- VA-01 fix
  for (const w of [360, 390, 600, 760, 820, 1280]) {
    const page = await open('/start/', w, { dsf: 2 });
    await css(page, '[data-page="start"] #process .ticket { margin-bottom: var(--s-5); }');
    const r = await page.evaluate(() => { const band = document.querySelector('.cta-band'); const st = document.querySelector('#process .stamp'); const b = st.getBoundingClientRect(); const bt = band.getBoundingClientRect().top; const sec = document.querySelector('#process'); return { gapToScallopTip: bt - 16 - b.bottom, ticketBottomToSectionBottom: sec.getBoundingClientRect().bottom - document.querySelector('#process .ticket').getBoundingClientRect().bottom }; });
    console.log('VA-01 fixed', w, JSON.stringify(r, (k, v) => typeof v === 'number' ? R(v) : v));
    if (w === 390) { await page.evaluate(() => scrollTo(0, document.querySelector('.cta-band').getBoundingClientRect().top + scrollY - 320)); await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, 'fix01_start_390.png') }); }
    await done(page);
  }
  // other pages with a ticket stamp directly above a band (outside my five pages, for the note)
  for (const p of ['/process/', '/contact/', '/web-design-baton-rouge/', '/', '/consulting/']) {
    const page = await open(p, 390);
    const r = await page.evaluate(() => [...document.querySelectorAll('main .stamp')].map(st => { const b = st.getBoundingClientRect(); const sec = st.closest('section'); const next = sec && sec.nextElementSibling; return { stamp: st.textContent.trim().replace(/\s+/g, ' '), bottomToSectionBottom: Math.round(sec.getBoundingClientRect().bottom - b.bottom), nextIsBand: !!(next && next.classList.contains('cta-band')) }; }));
    console.log('VA-01 stamps elsewhere@390', p, JSON.stringify(r));
    await done(page);
  }

  // ---- VA-03: care head at 980 and 1100 now, and with align-items:start
  for (const w of [980, 1100]) {
    const page = await open('/pricing/', w);
    await page.evaluate(() => scrollTo(0, document.querySelector('#care').getBoundingClientRect().top + scrollY - 120)); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `va03_pricing_${w}_care_now.png`) });
    await css(page, '[data-page="pricing"] :is(#consulting, #care) .section-head-split { align-items: start }');
    await page.evaluate(() => scrollTo(0, document.querySelector('#care').getBoundingClientRect().top + scrollY - 120)); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `fix03_pricing_${w}_care_start.png`) });
    await done(page);
  }
  {
    const page = await open('/pricing/', 1280);
    const r = await page.evaluate(() => { const c = document.querySelector('#care'); return { tag: c.tagName, cls: c.className, headIn: !!c.querySelector('.section-head-split'), headIs: c.matches('.section-head-split'), secPadTop: getComputedStyle(c.closest('section')).paddingTop, secTopToEyebrow: Math.round(c.querySelector('.eyebrow').getBoundingClientRect().top - c.closest('section').getBoundingClientRect().top), secTopToSub: Math.round((c.querySelector('.section-sub') || c.querySelector('.section-head-split').lastElementChild).getBoundingClientRect().top - c.closest('section').getBoundingClientRect().top) }; });
    console.log('VA-03 #care element', JSON.stringify(r));
    await done(page);
  }

  // ---- VA-05 fix: open the first row in #build
  for (const w of [390, 980, 1280, 1440]) {
    const page = await open('/services/', w);
    const before = await page.evaluate(() => ({ H: document.documentElement.scrollHeight }));
    await page.evaluate(() => { document.querySelector('#build details').open = true; });
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => { const b = document.getElementById('build'); const lead = b.querySelector('.svc-lead'), acc = b.querySelector('.faq'); return { leadH: Math.round(lead.getBoundingClientRect().height), accH: Math.round(acc.getBoundingClientRect().height), H: document.documentElement.scrollHeight }; });
    console.log('VA-05 with first row open', w, JSON.stringify(r), 'page grows by', r.H - before.H);
    if (w === 1440) { await page.evaluate(() => scrollTo(0, document.querySelector('.menu').getBoundingClientRect().bottom + scrollY - 260)); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, 'fix05_services_1440_open.png') }); }
    await done(page);
  }

  // ---- VA-07 fix
  {
    const page = await open('/consulting/', 390, { dsf: 3 });
    await css(page, '.cal-log .ico { flex: 0 0 var(--s-5); }');
    const r = await page.evaluate(() => [...document.querySelectorAll('.cal-log li')].map(li => { const icon = li.firstElementChild; const tn = [...li.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); const rg = document.createRange(); rg.selectNodeContents(tn); return { iconW: +icon.getBoundingClientRect().width.toFixed(1), iconH: +icon.getBoundingClientRect().height.toFixed(1), textX: +rg.getBoundingClientRect().left.toFixed(1) }; }));
    console.log('VA-07 fixed', JSON.stringify(r));
    await shotEl(page, '.cal-log', path.join(OUT, 'fix07_consulting_390_callog.png'), 30);
    await done(page);
  }

  // ---- VA-08 fix: narrower padding on the consulting button
  for (const w of [390, 980, 1100, 1280, 1440]) {
    const page = await open('/consulting/', w);
    await css(page, '[data-page="consulting"] .receipt .btn-block { padding-inline: var(--s-4); }');
    const r = await page.evaluate(() => { const b = [...document.querySelectorAll('main .btn')].find(x => /Check my real numbers/.test(x.textContent)); return { w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), parent: b.parentElement.className }; });
    console.log('VA-08 fixed', w, JSON.stringify(r));
    await done(page);
  }

  // ---- VA-09 fix
  for (const w of [1100, 1140, 1179, 1200, 1279]) {
    const page = await open('/', w);
    await css(page, '@media (min-width:1100px) and (max-width:1279.98px){ .tier-plan { min-height: 4.25em; min-height: 3lh; } }');
    const r = await page.evaluate(() => [...document.querySelectorAll('.board-tiers .tier')].map(t => ({ planH: Math.round(t.querySelector('.tier-plan').getBoundingClientRect().height), noteTop: Math.round(t.querySelector('.tier-note').getBoundingClientRect().top + scrollY) })));
    console.log('VA-09 fixed (min-height 3lh)', w, JSON.stringify(r));
    if (w === 1100) await shotEl(page, '.board-tiers', path.join(OUT, 'fix09_home_1100_board.png'), 20);
    await done(page);
  }
  await close();
})();
