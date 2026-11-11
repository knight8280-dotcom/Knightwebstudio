const { chromium } = require('playwright'); const base = 'http://localhost:8720';
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
(async () => { const b = await chromium.launch(); const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  // G1: lists drawn without markers that have no list role (outside hidden mocks)
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await block(ctx); let n = 0;
    for (const path of PAGES) { const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(150);
      const r = await p.evaluate(() => [...document.querySelectorAll('ul, ol')].filter(l => getComputedStyle(l).listStyleType === 'none' && l.getAttribute('role') !== 'list' && !l.closest('[aria-hidden="true"], [role="img"]')).map(l => l.tagName.toLowerCase() + (l.className ? '.' + l.className.trim().split(/\s+/).join('.') : '') + ' in ' + (l.parentElement.className || l.parentElement.tagName).toString().split(' ')[0] + (l.closest('header, footer') ? ' (chrome)' : '')));
      if (r.length) { n += r.length; console.log('G1', path, JSON.stringify([...new Set(r)])); } await p.close(); }
    console.log('G1 lists without markers and without role="list":', n); await ctx.close(); }
  // D5: a link to a closed row opens it (with the browser's own opening switched off, to test main.js alone)
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await block(ctx); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(base + '/services/#seo'); await p.waitForTimeout(500); const a = await p.evaluate(() => { const t = document.getElementById('seo'); const d = t.closest('details'); return { open: d.open, top: Math.round(t.getBoundingClientRect().top) }; });
    await p.goto(base + '/services/'); await p.waitForTimeout(300); await p.evaluate(() => { const d = document.getElementById('brand').closest('details'); d.open = false; }); await p.click('.menu a[href="#brand"]'); await p.waitForTimeout(900);
    const c = await p.evaluate(() => { const t = document.getElementById('brand'); return { open: t.closest('details').open, top: Math.round(t.getBoundingClientRect().top), hash: location.hash }; });
    console.log('D5 /services/#seo on arrival:', JSON.stringify(a), '| tap on the Brand row in the menu:', JSON.stringify(c), '| errors:', errs.length); await ctx.close(); }
  // A5: forced colours
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, forcedColors: 'active' }); await block(ctx); const p = await ctx.newPage(); await p.goto(base + '/faq/'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const bg = getComputedStyle(document.body).backgroundColor; const bur = document.querySelector('.burger'); const plus = getComputedStyle(document.querySelector('.faq-item summary'), '::after'); return { page: bg, burger: getComputedStyle(bur).backgroundColor, burgerBefore: getComputedStyle(bur, '::before').backgroundColor, plus: plus.backgroundImage.slice(0, 60) }; });
    console.log('A5 forced colours:', JSON.stringify(r)); await p.screenshot({ path: __dirname + '/shots/forced-faq-390.png', clip: { x: 0, y: 0, width: 390, height: 620 } });
    await p.goto(base + '/contact/'); await p.waitForTimeout(300); await p.check('input[name="services"]', { force: true }); const chip = p.locator('.chip').first(); await chip.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    console.log('A5 checked chip outline:', await p.evaluate(() => { const s = document.querySelector('.chip :checked + span'); const cs = getComputedStyle(s); return cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor; }));
    const bx = await p.locator('.chips').boundingBox(); await p.screenshot({ path: __dirname + '/shots/forced-chips-390.png', clip: { x: 0, y: Math.max(0, bx.y - 40), width: 390, height: bx.height + 80 } }); await ctx.close(); }
  // C3: on a phone the process stamp is revealed above the bar
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await block(ctx); const p = await ctx.newPage(); await p.goto(base + '/process/'); await p.waitForTimeout(400);
    let seenAt = null; for (let y = 0; y < 3000; y += 20) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(60); const r = await p.evaluate(() => { const s = document.querySelector('.stamp.reveal'); const bar = document.getElementById('mobile-cta'); return { vis: s.classList.contains('visible'), top: Math.round(s.getBoundingClientRect().top), bottom: Math.round(s.getBoundingClientRect().bottom), barTop: Math.round(bar.getBoundingClientRect().top), barShown: bar.classList.contains('show') }; }); if (r.vis) { seenAt = r; break; } }
    console.log('C3 process stamp when it is revealed:', JSON.stringify(seenAt), '(window 844 tall)'); await ctx.close(); }
  await b.close(); })();
