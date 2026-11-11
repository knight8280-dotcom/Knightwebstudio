const { launch, ctx, URL, PORT, chromium, ARGS } = require('./common');
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const b = await launch();
  // 1. Touch swipes with raw touch events
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await c.newPage(); const s = await c.newCDPSession(p);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const swipe = async (x, y, dx, dy) => {
      await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 12; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 12, y: y + dy * i / 12 }] }); await p.waitForTimeout(16); }
      await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    for (const sel of ['#services .kws-mark-art', '#services .kws-mark h3 a', '#process .kws-folder', '#pricing .kws-folders-tabs', '#pricing .is-front .kws-folder-body', '.cta-band']) {
      await p.evaluate(sl => document.querySelector(sl).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p.waitForTimeout(700);
      const pt = await p.evaluate(sl => { const r = document.querySelector(sl).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(Math.min(Math.max(r.top + Math.min(r.height / 2, 60), 420), innerHeight - 160)), y0: scrollY, href: location.href, hit: (e => e ? e.tagName + '.' + (e.className || '').toString().split(' ')[0] : null)(document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(Math.min(Math.max(r.top + Math.min(r.height / 2, 60), 420), innerHeight - 160)))) }; }, sel);
      await swipe(pt.x, pt.y, 0, -300); await p.waitForTimeout(900);
      const a = await p.evaluate(() => ({ y: scrollY, href: location.href, tab: [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true') }));
      const y1 = a.y; await swipe(pt.x, pt.y, -180, -14); await p.waitForTimeout(500);
      const bb = await p.evaluate(() => ({ y: scrollY, x: scrollX, href: location.href }));
      console.log(`touch swipe up 300 starting on ${sel} (hit ${pt.hit}): page moved ${a.y - pt.y0}px, navigated ${a.href !== pt.href}; sideways swipe: scrollX ${bb.x}, y moved ${bb.y - y1}, navigated ${bb.href !== pt.href}, selected tab ${a.tab}`);
    }
    // tap on a tab
    await p.evaluate(() => document.querySelector('#pricing .kws-folders-tabs').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(500);
    const tb = await p.evaluate(() => { const r = document.querySelectorAll('#pricing [role=tab]')[3].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.touchscreen.tap(tb.x, tb.y); await p.waitForTimeout(400);
    console.log('tap on 4th tab → selected', await p.evaluate(() => [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true')));
    await c.close();
  }
  // 2. Focus: visible and not obscured after the scroll settles (390, sticky header and phone bar present)
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const p = await c.newPage();
    await p.addInitScript(() => { try { localStorage.setItem('kws-motion', 'on'); } catch (e) {} });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => { scrollTo(0, 0); document.querySelector('.skip-link').focus(); });
    const rows = []; let shots = 0;
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(220);
      const f = await p.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null; if (!e.closest('[class*="kws-"]')) return { skip: 1, name: e.textContent.trim().slice(0, 20) };
        // the box the ring is drawn round
        const link = e.matches('.kws-link h3 a'); const box = link ? (e.closest('.kws-folder-body') || e.closest('.kws-link')) : e; const r = box.getBoundingClientRect();
        const st = getComputedStyle(e), af = getComputedStyle(e, '::after');
        const ring = link ? af.outlineWidth + ' ' + af.outlineStyle + ' ' + af.outlineColor : st.outlineWidth + ' ' + st.outlineStyle + ' ' + st.outlineColor;
        // what covers the focused box? sample a grid of points
        let covered = 0, total = 0, by = {};
        for (let gx = 0; gx < 6; gx++) for (let gy = 0; gy < 8; gy++) { const x = r.left + (gx + .5) * r.width / 6, y = r.top + (gy + .5) * r.height / 8; total++; if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) { covered++; by.offscreen = (by.offscreen || 0) + 1; continue; } const t = document.elementFromPoint(x, y); if (t && !box.contains(t) && !t.contains(box)) { const fx = t.closest('.site-header, .mobile-cta, .topbar'); if (fx) { covered++; const k = fx.className.split(' ')[0]; by[k] = (by[k] || 0) + 1; } } }
        return { name: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 26), role: e.getAttribute('role') || e.tagName, ring, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], hiddenPct: Math.round(100 * covered / total), by };
      });
      if (!f || f.skip) continue; rows.push(f);
      if (shots < 4 && (/tab/.test(f.role) || /Automation|Discovery|Pause/.test(f.name))) { await p.screenshot({ path: 'focus-' + (shots++) + '-' + f.name.replace(/[^a-z0-9]+/gi, '-').slice(0, 16) + '.png' }); }
      if (/Pause/.test(f.name) && rows.filter(r => /Pause/.test(r.name)).length > 1) break;
    }
    rows.forEach(r => console.log(`focus ${r.role} "${r.name}" ring ${r.ring} box ${r.rect} hidden ${r.hiddenPct}% ${JSON.stringify(r.by)}`));
    await c.close();
  }
  // 3. Pause button: what a screen reader gets on press (name change only?) and with no layers
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => { const bt = document.querySelectorAll('.kws-motion')[1]; const g = () => ({ label: bt.getAttribute('aria-label'), pressed: bt.getAttribute('aria-pressed'), live: !!document.querySelector('[aria-live] , [role=status]') && [...document.querySelectorAll('[aria-live],[role=status]')].map(e => e.textContent.trim().slice(0, 30)), iconPause: getComputedStyle(bt.querySelector('.kws-pause')).display, iconPlay: getComputedStyle(bt.querySelector('.kws-play')).display }); const a = g(); bt.click(); const b2 = g(); bt.click(); return [a, b2]; });
    console.log('pause button states:', JSON.stringify(r));
    console.log('aria:', await p.locator('.footer-links').ariaSnapshot());
    await c.close();
  }
  await b.close();
  // 4. bfcache reasons
  {
    const KIT = path.resolve(__dirname, '..', '..', '..'), REPO = '/home/user/Knightwebstudio';
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
    const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); let f = u.startsWith('/kit/') ? path.join(KIT, u) : path.join(REPO, u); if (u === '/other.html') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end('<!doctype html><title>other</title><p>other page</p>'); } fs.stat(f, (e, st) => { if (!e && st.isDirectory()) f = path.join(f, 'index.html'); fs.readFile(f, (e2, d) => { if (e2) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }); }).listen(8794, '127.0.0.1');
    for (const page of ['portable.html', 'demo.html']) {
      const b2 = await chromium.launch({ args: ARGS.concat(['--enable-features=BackForwardCache,BackForwardCacheMemoryControls', '--force-fieldtrials=']), ignoreDefaultArgs: ['--disable-back-forward-cache'] });
      const c = await b2.newContext({ viewport: { width: 390, height: 844 } }); await c.route(/plausible|hcaptcha|calendly|stripe|onrender/, r => r.abort());
      const p = await c.newPage(); const s = await c.newCDPSession(p); await s.send('Page.enable');
      const reasons = []; s.on('Page.backForwardCacheNotUsed', e => reasons.push(...(e.notRestoredExplanations || []).map(x => x.reason + (x.context ? '(' + x.context + ')' : ''))));
      await p.addInitScript(() => { window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); }; window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
      await p.goto('http://127.0.0.1:8794/kit/light/' + page, { waitUntil: 'load' }); await p.waitForTimeout(1800);
      await p.evaluate(() => { const t = document.querySelectorAll('.kws-folders--stack [role=tab]'); t[t.length - 1].click(); window.__mark = 'kept'; });
      await p.goto('http://127.0.0.1:8794/other.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
      await p.goBack({ waitUntil: 'load' }).catch(() => {}); await p.waitForTimeout(1500);
      const a = await p.evaluate(() => window.__draws); await p.waitForTimeout(2000);
      const st = await p.evaluate(() => ({ persisted: window.__persisted, mark: window.__mark, draws: window.__draws, live: document.querySelectorAll('.kws-shader.is-live').length, sel: [...document.querySelectorAll('.kws-folders--stack [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true'), lost: null }));
      console.log(`bfcache ${page}:`, JSON.stringify(st), `draws in 2s after return: ${st.draws - a}`, '| not-restored reasons:', [...new Set(reasons)].join(', ') || 'none reported');
      await b2.close();
    }
    srv.close();
  }
})();
