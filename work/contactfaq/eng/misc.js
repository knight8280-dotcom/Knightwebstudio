const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720'; const fs = require('fs'); fs.mkdirSync(__dirname + '/misc', { recursive: true });
(async () => {
  const b = await chromium.launch();
  // 1. FAQ phone bar + anchors + details behaviour at 390
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load/.test(m.text())) errs.push(m.text()); });
    await p.goto(base + '/faq/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    const log = [];
    for (let y = 0; y <= H; y += 60) { await p.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(90);
      const s = await p.evaluate(() => { const bar = document.getElementById('mobile-cta'); const shown = bar.classList.contains('show'); const bt = bar.getBoundingClientRect().top; const covered = shown ? [...document.querySelectorAll('main a.btn, main summary, .site-footer a')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > bt + 2 && r.top < innerHeight; }).map(e => e.textContent.trim().slice(0, 20)) : []; return { y: Math.round(scrollY), shown, covered: covered.join('|'), atEnd: scrollY + innerHeight >= document.documentElement.scrollHeight - 2 }; });
      log.push(s); }
    const firstShow = log.find(s => s.shown), lastShow = [...log].reverse().find(s => s.shown);
    console.log('FAQ 390 height', H, 'bar first shows at y', firstShow && firstShow.y, 'last shown at y', lastShow && lastShow.y, 'shown at end:', log[log.length - 1].shown);
    console.log('  positions where the bar overlaps CTA-band buttons:', log.filter(s => /Book a discovery|Send an enquiry/.test(s.covered)).map(s => s.y + ':' + s.covered).join(' ; ') || 'none');
    // where are the cta buttons, and where does footer start
    console.log('  ', await p.evaluate(() => { const q = s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)]; }; return JSON.stringify({ ctaBtns: q('.cta-band .btn-row'), footer: q('.site-footer'), ctaBand: q('.cta-band'), skyline: q('.footer-skyline') }); }));
    // anchors
    for (const id of ['faq-build', 'faq-prices', 'faq-after', 'faq-automation']) { await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.click(`.toc a[href="#${id}"]`); await p.waitForTimeout(900);
      const r = await p.evaluate(i => { const h = document.querySelector('#' + i + ' h2').getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect(); return { headTop: Math.round(h.top), headerBottom: Math.round(hd.bottom), hash: location.hash }; }, id);
      console.log('  anchor', id, JSON.stringify(r), r.headTop >= r.headerBottom ? 'clear' : 'UNDER HEADER'); }
    // details toggles
    const d = await p.evaluate(() => { const ds = [...document.querySelectorAll('details')]; return { n: ds.length, open: ds.filter(x => x.open).length, sumH: [...document.querySelectorAll('summary')].map(s => Math.round(s.getBoundingClientRect().height)) }; });
    console.log('  details', JSON.stringify(d));
    await p.evaluate(() => scrollTo({ top: 700, behavior: 'instant' })); const second = p.locator('summary').nth(1); await second.click(); await p.waitForTimeout(400);
    console.log('  second opens on tap:', await p.evaluate(() => document.querySelectorAll('details')[1].open), 'marker transform:', await p.evaluate(() => getComputedStyle(document.querySelectorAll('summary')[1], '::after').transform));
    await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    console.log('  keyboard Enter toggles third:', await p.evaluate(() => document.querySelectorAll('details')[2].open));
    // closed height
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = false)); await p.waitForTimeout(100);
    const parts = await p.evaluate(() => { const q = s => Math.round(document.querySelector(s).getBoundingClientRect().height); return { total: document.documentElement.scrollHeight, topbar: q('.topbar'), header: q('.site-header'), pageHead: q('.page-head'), faqSection: q('#faq'), toc: q('.toc'), groups: q('.faq-groups'), cta: q('.cta-band'), footer: q('.site-footer'), mainPadBottom: getComputedStyle(document.querySelector('main')).paddingBottom }; });
    console.log('  closed heights at 390:', JSON.stringify(parts));
    console.log('  console errors:', errs);
    await ctx.close(); }
  // contact phone heights + first-screen content
  { for (const w of [360, 390, 430]) { const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/contact/', { waitUntil: 'load' }); await p.waitForTimeout(400);
      console.log('contact', w, await p.evaluate(() => { const q = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }; return JSON.stringify({ total: document.documentElement.scrollHeight, tel: q('.talk-tel'), book: q('.talk .btn'), firstField: q('#name'), submit: q('#submit-btn'), form: q('#contact-form'), side: q('.contact-side'), footer: q('.site-footer'), telFont: getComputedStyle(document.querySelector('.talk-tel')).fontSize, fieldH: q('#name')[1] - q('#name')[0], selH: q('#package')[1] - q('#package')[0], btnH: q('#submit-btn')[1] - q('#submit-btn')[0], chipH: Math.round(document.querySelector('.chip').getBoundingClientRect().height), taH: q('#message')[1] - q('#message')[0], selectClip: (() => { const s = document.getElementById('package'); return s.scrollWidth + '/' + s.clientWidth; })() }); }));
      await ctx.close(); } }
  // desktop positions: is submit/stamp in first screen at big viewports
  { for (const [w, h] of [[1440, 900], [1920, 1080], [2560, 1440]]) { const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/contact/', { waitUntil: 'load' }); await p.waitForTimeout(400);
      console.log('contact', w + 'x' + h, await p.evaluate(() => { const q = s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }; return JSON.stringify({ captcha: q('.captcha-wrap'), submit: q('#submit-btn'), stamp: q('main .stamp'), formW: Math.round(document.querySelector('#contact-form').getBoundingClientRect().width), sideW: Math.round(document.querySelector('.contact-side').getBoundingClientRect().width), stepsMeasure: Math.round(document.querySelector('.steps p').getBoundingClientRect().width) }); }));
      await ctx.close(); } }
  await b.close();
})();
