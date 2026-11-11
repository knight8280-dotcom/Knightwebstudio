const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const S = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const mk = async (w, h, theme = 'light') => { const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', colorScheme: theme, deviceScaleFactor: 2 }); await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); return ctx; };
  const shot = async (ctx, path, sel, file, css) => { const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); if (css) await p.addStyleTag({ content: css }); await p.waitForTimeout(300); const l = p.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await l.screenshot({ path: S + '/' + file }); await p.close(); };

  // the brush under a marked word
  { const ctx = await mk(390, 844); await shot(ctx, '/pricing/', '.page-head h1', 'mark-pricing-390.png'); await shot(ctx, '/', 'h1', 'mark-home-390.png'); await shot(ctx, '/services/', '.page-head h1', 'mark-services-390.png'); await shot(ctx, '/consulting/', '.page-head h1', 'mark-consulting-390.png'); await shot(ctx, '/process/', '.page-head h1', 'mark-process-390.png'); await ctx.close();
    const c2 = await mk(1440, 900); await shot(c2, '/pricing/', '.page-head h1', 'mark-pricing-1440.png'); await c2.close(); }
  // where each page's .mark sits: last line or not
  { const ctx = await mk(390, 844); for (const path of ['/', '/services/', '/consulting/', '/process/', '/pricing/', '/about/', '/start/', '/web-design-baton-rouge/']) for (const w of [390, 1440]) { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 900 }); await p.goto(base + path); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
      const r = await p.evaluate(() => { const m = document.querySelector('h1 .mark'); if (!m) return null; const h = m.closest('h1').getBoundingClientRect(), r = m.getBoundingClientRect(); const a = getComputedStyle(m, '::after'); return { word: m.textContent, onLastLine: r.bottom > h.bottom - 8, z: a.zIndex, anim: a.animationName, bottom: a.bottom }; }); console.log('mark', path, w, JSON.stringify(r)); await p.close(); } await ctx.close(); }

  // night: paper objects on a sand band
  { const ctx = await mk(390, 844, 'dark'); await shot(ctx, '/start/', '.ticket', 'night-start-ticket.png'); await shot(ctx, '/web-design-gonzales/', '.city-meet', 'night-city-card.png');
    const dark2 = ':root[data-theme="dark"]{--paper-2:#0F131D}'; await shot(ctx, '/start/', '.ticket', 'night-start-ticket-sandDarker.png', dark2);
    const c2 = await mk(1440, 900, 'dark'); const p = await c2.newPage(); await p.goto(base + '/pricing/'); await p.waitForTimeout(400); await p.screenshot({ path: S + '/night-pricing-1440-full.png', fullPage: true }); await p.addStyleTag({ content: dark2 }); await p.waitForTimeout(200); await p.screenshot({ path: S + '/night-pricing-1440-full-sandDarker.png', fullPage: true }); await p.close();
    const q = await c2.newPage(); await q.goto(base + '/'); await q.waitForTimeout(400); await q.screenshot({ path: S + '/night-home-1440-full.png', fullPage: true }); await q.addStyleTag({ content: dark2 }); await q.waitForTimeout(200); await q.screenshot({ path: S + '/night-home-1440-full-sandDarker.png', fullPage: true }); await q.close();
    // which paper objects sit on a sand band, per page
    for (const path of ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-gonzales/']) { const p = await c2.newPage(); await p.goto(base + path); await p.waitForTimeout(200);
      console.log('on sand', path, JSON.stringify(await p.evaluate(() => { const out = {}; document.querySelectorAll('.section-sand :is(.card, .panel:not(.on-blue), .vig, .ticket, .sheet, .receipt, .bizcard, .print, .notice, .cal, .leads, .spec tr, .phone-frame, .browser, .faq)').forEach(e => { if (e.closest('.on-paper, .on-blue')) return; const k = e.className.toString().split(' ')[0] || e.tagName; out[k] = (out[k] || 0) + 1; }); return out; }))); await p.close(); }
    await ctx.close(); await c2.close(); }

  // characters per line at 1440
  { const ctx = await mk(1440, 900); for (const [path, sel] of [['/terms/', '.prose > p'], ['/privacy/', '.prose > p'], ['/faq/', '.faq-body p'], ['/about/', '.prose p'], ['/pricing/', '.lede'], ['/', '.section-sub'], ['/pricing/', '.cta-copy p'], ['/consulting/', '.steps p'], ['/web-design-gonzales/', '.prose p']]) { const p = await ctx.newPage(); await p.goto(base + path); await p.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = true); return document.fonts.ready; }); await p.waitForTimeout(200);
      const r = await p.evaluate(sel => { const res = []; for (const el of document.querySelectorAll(sel)) { const range = document.createRange(); const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const lines = new Map(); while (tw.nextNode()) { const n = tw.currentNode; for (let i = 0; i < n.length; i++) { range.setStart(n, i); range.setEnd(n, i + 1); const rc = range.getClientRects()[0]; if (!rc) continue; const k = Math.round(rc.top); lines.set(k, (lines.get(k) || 0) + 1); } } const v = [...lines.values()]; if (v.length > 2) res.push(...v.slice(0, -1)); } res.sort((a, b) => a - b); return res.length ? { lines: res.length, median: res[res.length >> 1], p90: res[Math.floor(res.length * .9)], max: res[res.length - 1], widthPx: Math.round(document.querySelector(sel).getBoundingClientRect().width), fs: getComputedStyle(document.querySelector(sel)).fontSize } : null; }, sel);
      console.log('chars/line', path, sel, JSON.stringify(r)); await p.close(); } await ctx.close(); }

  // phone bar while the closing band's button is on screen
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto(base + '/pricing/'); await p.waitForTimeout(500);
    const top = await p.evaluate(() => Math.round(document.querySelector('.cta-band').getBoundingClientRect().top + scrollY)); let both = 0, total = 0, sample = null;
    for (let y = top - 844; y <= top + 300; y += 20) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); const r = await p.evaluate(() => { const bt = document.querySelector('.cta-band .btn-primary').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const shown = bar.classList.contains('show'); return { btnVisible: bt.top >= 0 && bt.bottom <= innerHeight - (shown ? 70 : 0), shown, bandTop: Math.round(document.querySelector('.cta-band').getBoundingClientRect().top), btnBottom: Math.round(bt.bottom) }; }); total++; if (r.btnVisible && r.shown) { both++; sample = sample || r; } }
    console.log('phone bar shown while the band\'s own booking button is on screen: ' + both + ' of ' + total + ' scroll stops (20px apart)', JSON.stringify(sample));
    await p.evaluate(v => scrollTo(0, v), top - 420); await p.waitForTimeout(500); await p.screenshot({ path: S + '/bar-over-band-390.png' }); await ctx.close(); }

  // consulting: calendar marker, tag dot at night; work: case facts
  { const ctx = await mk(390, 844, 'dark'); await shot(ctx, '/consulting/', '.cal', 'night-consulting-cal.png'); await shot(ctx, '/consulting/', '.tag', 'night-consulting-tag.png'); await shot(ctx, '/consulting/', '.leads', 'night-consulting-leads.png'); await ctx.close();
    const c2 = await mk(390, 844); await shot(c2, '/work/', '.case-facts', 'work-casefacts-390.png'); await shot(c2, '/consulting/', '.cal', 'day-consulting-cal.png'); await c2.close(); }
  await b.close();
})();
