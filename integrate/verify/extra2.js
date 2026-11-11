const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080], [820, 1180], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx); const p = await ctx.newPage();
    await p.goto(base + '/contact/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ requested: !!document.querySelector('script[src*="hcaptcha"]'), slotTop: Math.round(document.getElementById('hcaptcha-slot').getBoundingClientRect().top), vh: innerHeight }));
    await p.waitForTimeout(3600);
    const late = await p.evaluate(() => !!document.querySelector('script[src*="hcaptcha"]'));
    console.log(`hCaptcha at ${w}x${h}: requested within 0.8s of load: ${r.requested} (slot top ${r.slotTop}px, window ${r.vh}px); requested after 4.4s with no interaction: ${late}`);
    await ctx.close();
  }
  // theme toggle on a phone, persistence, and dark-by-device with a saved light choice
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true }); await block(ctx); const p = await ctx.newPage();
    await p.goto(base + '/services/'); const a = await p.getAttribute('html', 'data-theme');
    await p.tap('#theme-toggle'); const c = await p.getAttribute('html', 'data-theme'); await p.goto(base + '/faq/'); const d = await p.getAttribute('html', 'data-theme');
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); const meta = await p.getAttribute('meta[name="theme-color"]', 'content');
    console.log(`phone, device dark: first visit ${a}; after tapping the toggle ${c}; next page ${d} bg ${bg} theme-color ${meta}`);
    await p.goto(base + '/404.html'); console.log('404 with saved light on a dark device:', await p.getAttribute('html', 'data-theme'), await p.evaluate(() => getComputedStyle(document.body).backgroundColor));
    await p.goto(base + '/start/'); await p.tap('#theme-toggle'); console.log('/start/ toggle works:', await p.getAttribute('html', 'data-theme'));
    await ctx.close(); }
  // 404 after four seconds: header still sticky, .js removed, nothing hidden
  { const ctx = await b.newContext({ viewport: { width: 390, height: 600 } }); const p = await ctx.newPage(); await p.goto(base + '/404.html'); await p.waitForTimeout(4500);
    console.log('404 after 4.5s:', await p.evaluate(() => ({ js: document.documentElement.classList.contains('js'), headerPos: getComputedStyle(document.getElementById('site-header')).position, over: document.documentElement.scrollWidth > innerWidth })));
    await ctx.close(); }
  // link into a closed services row opens it
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await block(ctx); const p = await ctx.newPage();
    await p.goto(base + '/services/'); const ids = await p.evaluate(() => [...document.querySelectorAll('details .faq-body[id], details [id]')].map(e => e.id));
    const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')));
    console.log('services: ids inside closed rows:', ids.join(','), '| in-page links:', [...new Set(hrefs)].join(','));
    const res = [];
    for (const id of ids) { await p.goto(base + '/services/#' + id); await p.waitForTimeout(300); res.push([id, await p.evaluate(i => { const e = document.getElementById(i); const d = e.closest('details'); const r = e.getBoundingClientRect(); return d.open && r.top >= 0 && r.top < innerHeight; }, id)]); }
    console.log('services: arriving on #id opens the row and shows it:', JSON.stringify(res));
    await p.goto(base + '/services/'); await p.click('.menu a[href="#' + ids[0] + '"]').catch(e => console.log('no menu link for', ids[0])); await p.waitForTimeout(900);
    console.log('services: clicking the menu link opens its row:', await p.evaluate(i => document.getElementById(i).closest('details').open, ids[0]));
    await ctx.close(); }
  // header: "Book a free call" on one line and nothing wraps, 1100 to 1400 in 10px steps; header at 320 to 400
  { const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } }); await block(ctx); const p = await ctx.newPage(); await p.goto(base + '/pricing/'); const bad = [];
    for (let w = 1100; w <= 1400; w += 10) { await p.setViewportSize({ width: w, height: 800 }); for (const y of [0, 600]) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(350);
      const r = await p.evaluate(() => { const c = document.querySelector('.header-cta').getBoundingClientRect(), hi = document.querySelector('.header-inner').getBoundingClientRect(); return { ch: Math.round(c.height), hh: Math.round(hi.height), right: Math.round(c.right), edge: innerWidth }; });
      if (r.ch > 46 || r.hh > 74 || r.right > r.edge) bad.push([w, y, r]); } }
    console.log('header 1100-1400: wrapped or overflowing at', JSON.stringify(bad));
    const bad2 = [];
    for (let w = 320; w <= 1090; w += 10) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(80);
      const r = await p.evaluate(() => { const hi = document.querySelector('.header-inner').getBoundingClientRect(); const kids = [...document.querySelectorAll('.header-inner > .brand, .header-actions')].map(e => Math.round(e.getBoundingClientRect().top)); return { hh: Math.round(hi.height), tops: kids }; });
      if (r.hh > 66) bad2.push([w, r]); }
    console.log('header 320-1090: taller than one row at', JSON.stringify(bad2));
    await ctx.close(); }
  await b.close();
})();
