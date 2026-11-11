const { chromium } = require('playwright');
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  const mk = async (w, h, opts = {}) => { const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h } }, opts)); await ctx.route(/plausible\.io|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); return ctx; };
  const tr = (p, sel) => p.evaluate(s => getComputedStyle(document.querySelector(s)).transform, sel);

  // 1. button hover / active with a mouse
  { const ctx = await mk(1440, 900); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/pricing/'); await p.waitForTimeout(400);
    const sel = '.page-head .btn-primary'; const box = await p.locator(sel).boundingBox();
    const rest = await tr(p, sel); await p.mouse.move(box.x + 20, box.y + 20); await p.waitForTimeout(400); const hov = await tr(p, sel);
    await p.mouse.down(); await p.waitForTimeout(400); const act = await tr(p, sel); await p.mouse.move(0, 0); await p.mouse.up();
    console.log('1 .btn rest/hover/active transform:', rest, '|', hov, '|', act);
    await ctx.close(); }

  // 2. hover lift on a revealed print
  for (const path of ['/', '/start/', '/web-design-gonzales/']) { const ctx = await mk(1440, 900); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(300);
    const loc = p.locator('a.print').first(); await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
    const cls = await loc.getAttribute('class'); const before = await loc.evaluate(e => getComputedStyle(e).transform); await loc.hover(); await p.waitForTimeout(500);
    console.log('2', path, 'a.print class=[' + cls + '] transform rest/hover:', before, '|', await loc.evaluate(e => getComputedStyle(e).transform), '| shadow changed:', await loc.evaluate(e => getComputedStyle(e).boxShadow.length));
    await ctx.close(); }

  // 3. menu sheet flash when the window crosses below 1100
  { const ctx = await mk(1440, 900); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/pricing/'); await p.waitForTimeout(500);
    await p.setViewportSize({ width: 1000, height: 900 }); const s = [];
    for (const t of [0, 60, 90, 150, 300]) { await p.waitForTimeout(t ? t - (s.length ? [0, 60, 90, 150, 300][s.length - 1] : 0) : 0); s.push(t + 'ms:' + await p.evaluate(() => { const c = getComputedStyle(document.getElementById('nav')); return (+c.opacity).toFixed(2) + '/' + c.visibility; })); }
    console.log('3 #nav opacity/visibility after resizing 1440 -> 1000:', s.join('  '));
    await ctx.close(); }

  // 4. 404 header: sticky, then static after the 4s fallback
  { const ctx = await mk(390, 844); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/404.html'); await p.waitForTimeout(300);
    const f = () => p.evaluate(() => [document.documentElement.classList.contains('js'), getComputedStyle(document.getElementById('site-header')).position, document.documentElement.scrollHeight]);
    const a = await f(); await p.waitForTimeout(4300); console.log('4 404 at 390 [html.js, header position, page height] at 0.3s / 4.6s:', JSON.stringify(a), JSON.stringify(await f()));
    await ctx.close(); }

  // 5. contact form: the status line after the fields are corrected; focus after Send
  { const ctx = await mk(390, 844); let hc = []; await ctx.route(/hcaptcha\.com/, r => { hc.push(Date.now()); r.abort(); }); const p = await ctx.newPage(); const t0 = Date.now(); await p.goto(base + '/contact/', { waitUntil: 'load' }); const tl = Date.now();
    await p.waitForTimeout(1500);
    console.log('7 hCaptcha script requested before any scroll or focus at 390x844:', hc.length ? 'yes, ' + (hc[0] - t0) + 'ms after navigation (load event at ' + (tl - t0) + 'ms)' : 'no', '| slot y =', await p.evaluate(() => Math.round(document.getElementById('hcaptcha-slot').getBoundingClientRect().top + scrollY)), '| slot attrs', await p.evaluate(() => document.getElementById('hcaptcha-slot').outerHTML.slice(0, 220)));
    await p.click('#submit-btn'); await p.waitForTimeout(300);
    const st1 = await p.evaluate(() => [document.getElementById('form-status').textContent, document.getElementById('form-status').className, document.querySelectorAll('#contact-form .invalid').length, [...document.querySelectorAll('#contact-form .error')].map(e => e.textContent).filter(Boolean)]);
    await p.fill('#name', 'Sam Tester'); await p.fill('#email', 'sam@example.com'); await p.fill('#message', 'We need a new website for our plumbing business.'); await p.locator('#message').blur(); await p.waitForTimeout(700);
    const st2 = await p.evaluate(() => [document.getElementById('form-status').textContent, document.getElementById('form-status').className, document.querySelectorAll('#contact-form .invalid').length, getComputedStyle(document.getElementById('form-status')).display]);
    console.log('5 after empty submit:', JSON.stringify(st1)); console.log('5 after correcting all fields:', JSON.stringify(st2));
    await ctx.close(); }

  // 6. focus ring at the bottom edge, desktop
  for (const path of ['/terms/', '/privacy/', '/about/', '/services/']) { const ctx = await mk(1440, 900, { reducedMotion: 'reduce' }); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(300);
    let cut = 0, n = 0; const who = [];
    for (let i = 0; i < 90; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(25); const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const rc = e.getBoundingClientRect(); return { b: rc.bottom, t: e.textContent.trim().slice(0, 24), inFooter: !!e.closest('.site-footer') }; }); if (!r) continue; n++; if (r.b > 900 - 6 && r.b <= 900 + 1) { cut++; who.push(r.t + '@' + Math.round(r.b)); } }
    console.log('6', path, '1440x900: tab stops whose box ends within 6px of the window bottom (ring 3px + offset 3px is cut):', cut, 'of', n, JSON.stringify(who.slice(0, 5)));
    await ctx.close(); }

  // 8. services: a link to a closed row
  { const ctx = await mk(390, 844, { reducedMotion: 'reduce' }); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/services/#seo'); await p.waitForTimeout(700);
    console.log('8 chromium /services/#seo: row open =', await p.evaluate(() => document.getElementById('seo').closest('details').open), '| target top =', await p.evaluate(() => Math.round(document.getElementById('seo').getBoundingClientRect().top)));
    await p.goto(base + '/services/'); await p.waitForTimeout(300); await p.click('a[href="#brand"]'); await p.waitForTimeout(700);
    console.log('8 chromium menu tap #brand: row open =', await p.evaluate(() => document.getElementById('brand').closest('details').open));
    await ctx.close(); }

  // 9. phone bar over the closing band
  { const ctx = await mk(390, 844, { reducedMotion: 'reduce', isMobile: true, hasTouch: true }); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/pricing/'); await p.waitForTimeout(400);
    await p.evaluate(() => { const b = document.querySelector('.cta-band .btn-primary'); b.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(700);
    console.log('9 /pricing/ 390: closing band button centred; phone bar shown =', await p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show')), '| bar text =', await p.evaluate(() => document.getElementById('mobile-cta').textContent.replace(/\s+/g, ' ').trim()), '| band button =', await p.evaluate(() => document.querySelector('.cta-band .btn-primary').textContent.trim()), '| distance bar top - band primary bottom =', await p.evaluate(() => Math.round(document.getElementById('mobile-cta').getBoundingClientRect().top - document.querySelector('.cta-band .btn-primary').getBoundingClientRect().bottom)));
    await ctx.close(); }

  // 10. short pages: does the footer end above the bottom of a tall window?
  for (const [w, h] of [[1440, 1300], [820, 1180], [1920, 1200]]) { const out = [];
    for (const path of ['/404.html', '/checkout/', '/checkout/success/', '/contact/', '/faq/', '/privacy/']) { const ctx = await mk(w, h, { reducedMotion: 'reduce' }); await ctx.route(/hcaptcha\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(500);
      out.push(path + ' ' + await p.evaluate(() => Math.round(innerHeight - document.querySelector('.site-footer').getBoundingClientRect().bottom - scrollY)) ); await ctx.close(); }
    console.log('10 paper under the footer at ' + w + 'x' + h + ' (px, >0 = footer floats):', out.join(' | ')); }
  await b.close();
})();
