// Screenshot a region in light and dark at several widths
const { chromium } = require('playwright');
const [path, sel, widths, tag] = process.argv.slice(2);
(async () => { const b = await chromium.launch();
  for (const w of widths.split(',').map(Number)) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const el = await p.$(sel); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const info = await p.evaluate(s => { const h = document.querySelector(s); const e = h.querySelector('.eyebrow'), sub = h.querySelector('.section-sub'); return e && sub ? `eyebrow top ${Math.round(e.getBoundingClientRect().top)} intro top ${Math.round(sub.getBoundingClientRect().top)} intro h ${Math.round(sub.offsetHeight)}` : ''; }, sel);
    await el.screenshot({ path: `${tag}_${w}_${scheme}.png` }); console.log(tag, w, scheme, info); await ctx.close(); }
  await b.close(); })();
