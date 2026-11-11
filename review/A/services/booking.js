// Every [data-booking] and .booking-only element on all 19 pages, with the real booking link. Nothing is booked.
const { launch, watch } = require('./lib');
const fs = require('fs');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const WANT = 'https://calendly.com/knightwebstudio1/30min';
(async () => {
  const b = await launch(); const out = { new: {}, baseline: {} };
  for (const [tag, base] of [['new', 'http://localhost:8720'], ['baseline', 'http://localhost:8700']]) {
    for (const [mode, w, h] of [['desktop', 1280, 800], ['phone', 390, 844]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mode === 'phone', hasTouch: mode === 'phone' });
      // the checkout pages must not create sessions here: this pass only reads links
      await ctx.route(/onrender\.com|js\.stripe\.com/, r => r.abort());
      for (const p of PAGES) {
        const page = await ctx.newPage();
        await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(400);
        // scroll to the bottom and back so the sticky bar and reveals are in their used state
        await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } scrollTo(0, innerHeight * 1.2); }); await page.waitForTimeout(400);
        const els = await page.evaluate(() => [...document.querySelectorAll('[data-booking], .booking-only')].map(a => { const r = a.getBoundingClientRect(); const cs = getComputedStyle(a);
          return { tag: a.tagName, booking: a.hasAttribute('data-booking'), only: a.classList.contains('booking-only'), text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 50), href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), hidden: a.hidden, display: cs.display, shown: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0, where: (a.closest('header,.mobile-cta,.cta-band,footer,.nav-foot,main') || {}).className || (a.closest('header,footer,main') || {}).tagName, h: Math.round(r.height) }; }));
        const src = await (await ctx.request.get(base + p)).text();
        const srcHrefs = [...src.matchAll(/<a\b[^>]*\bdata-booking\b[^>]*>/g)].map(m => (m[0].match(/href="([^"]*)"/) || [])[1]);
        out[tag][p + '|' + mode] = { els, srcHrefs };
        await page.close();
      }
      await ctx.close();
    }
  }
  // click behaviour with the real link (new site): header button on a desktop, sticky bar button on a phone, success page button
  out.clicks = [];
  for (const [mode, w, h, path, sel] of [['desktop', 1280, 800, '/', '.header-cta[data-booking]'], ['phone', 390, 844, '/pricing/', '#mobile-cta [data-booking]'], ['phone', 390, 844, '/contact/', 'main .booking-only'], ['desktop', 1280, 800, '/checkout/success/?plan=starter-deposit', '#success-book'], ['phone', 390, 844, '/start/', 'main [data-booking]']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mode === 'phone', hasTouch: mode === 'phone' });
    await ctx.route(/onrender\.com/, r => r.abort());
    const page = await ctx.newPage(); const rec = { mode, path, sel };
    await page.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    if (/mobile-cta/.test(sel)) { await page.evaluate(() => scrollTo(0, innerHeight * 1.5)); await page.waitForTimeout(700); }
    await page.evaluate(() => { const o = window.plausible; window.__ev = []; window.plausible = function () { window.__ev.push([].slice.call(arguments)); return o && o.apply(this, arguments); }; });
    const loc = page.locator(sel).first(); rec.count = await page.locator(sel).count();
    try {
      const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 15000 }), mode === 'phone' ? loc.tap() : loc.click()]);
      const resp = await popup.waitForEvent('response', { predicate: r => r.url().startsWith('https://calendly.com/') && r.request().resourceType() === 'document', timeout: 30000 }).catch(() => null);
      await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
      await popup.waitForTimeout(6000);
      rec.popup = { url: popup.url(), status: resp && resp.status(), title: await popup.title().catch(() => null), opener: await popup.evaluate(() => window.opener === null ? 'null (noopener works)' : 'HAS OPENER').catch(e => String(e).slice(0, 80)), text: (await popup.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 260)).catch(() => '')) };
      await popup.screenshot({ path: `shots/booking__${mode}__${path.replace(/[^a-z0-9]+/gi, '_')}.png` }).catch(() => {});
    } catch (e) { rec.error = String(e).slice(0, 300); }
    rec.originalStillAt = page.url(); rec.events = await page.evaluate(() => window.__ev);
    out.clicks.push(rec); await ctx.close(); console.log(JSON.stringify(rec));
  }
  fs.writeFileSync('booking.json', JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
