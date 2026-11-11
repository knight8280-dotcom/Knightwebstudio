const { launch, ctx, URL, PORT, chromium, ARGS } = require('./common');
const http = require('http'), fs = require('fs'), path = require('path');
const draws = () => { window.__draws = 0; const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); }; };
(async () => {
  const b = await launch();
  // 1. Touch: vertical swipes that start on kit parts scroll the page; wheel is not hijacked
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await c.newPage(); const s = await c.newCDPSession(p);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    for (const sel of ['#services .kws-mark-art', '#services .kws-mark h3 a', '#process .kws-folder', '#pricing .kws-folders-tabs', '#pricing .is-front .kws-folder-body', '.cta-band']) {
      await p.evaluate(sl => { const e = document.querySelector(sl); e.scrollIntoView({ block: 'center', behavior: 'instant' }); }, sel); await p.waitForTimeout(350);
      const pt = await p.evaluate(sl => { const r = document.querySelector(sl).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(Math.min(Math.max(r.top + Math.min(r.height / 2, 60), 120), innerHeight - 200)), y0: scrollY, href: location.href }; }, sel);
      await s.send('Input.synthesizeScrollGesture', { x: pt.x, y: pt.y, yDistance: -300, xDistance: 0, speed: 900, gestureSourceType: 'touch' });
      await p.waitForTimeout(500);
      const y1 = await p.evaluate(() => ({ y: scrollY, href: location.href }));
      // diagonal, mostly horizontal swipe: must not move the page sideways or navigate
      await s.send('Input.synthesizeScrollGesture', { x: pt.x, y: pt.y, yDistance: -20, xDistance: -200, speed: 900, gestureSourceType: 'touch' });
      await p.waitForTimeout(300);
      const y2 = await p.evaluate(() => ({ x: scrollX, href: location.href }));
      console.log(`touch swipe up 300px on ${sel}: page scrolled ${y1.y - pt.y0}px, navigated: ${y1.href !== pt.href}; sideways swipe: scrollX ${y2.x}, navigated: ${y2.href !== pt.href}`);
    }
    await c.close();
    const c2 = await ctx(b, { viewport: { width: 1280, height: 800 } }); const p2 = await c2.newPage(); await p2.goto(URL, { waitUntil: 'load' }); await p2.waitForTimeout(1200); await p2.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    for (const sel of ['#services .kws-mark-art', '#pricing .kws-folders-tabs', '.cta-band']) {
      await p2.evaluate(sl => document.querySelector(sl).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p2.waitForTimeout(300);
      const r = await p2.evaluate(sl => { const r = document.querySelector(sl).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 40), y0: scrollY }; }, sel);
      await p2.mouse.move(r.x, r.y); await p2.mouse.wheel(0, 240); await p2.waitForTimeout(300);
      const y = await p2.evaluate(() => scrollY); const sel2 = await p2.evaluate(() => [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true'));
      console.log(`wheel 240 over ${sel}: page scrolled ${y - r.y0}px, selected tab still ${sel2}`);
    }
    // mouse drag across a card link then release elsewhere: no navigation; plain click navigates
    await p2.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'center', behavior: 'instant' })); await p2.waitForTimeout(300);
    const card = await p2.evaluate(() => { const r = document.querySelector('#services .kws-mark').getBoundingClientRect(); return { x: r.left + 60, y: r.top + 120, w: r.width }; });
    const before = p2.url(); await p2.mouse.move(card.x, card.y); await p2.mouse.down(); await p2.mouse.move(card.x + 500, card.y + 10, { steps: 8 }); await p2.mouse.up(); await p2.waitForTimeout(400);
    console.log('mouse drag from card 1 to outside it: navigated?', p2.url() !== before);
    await c2.close();
  }
  // 2. Theme toggle while running: do the layers repaint in the new colours? sample canvas-area pixels
  {
    const c = await ctx(b, { viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); await p.addInitScript(draws);
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2000);
    const px = async (sel) => { const r = await p.evaluate(sl => { const e = document.querySelector(sl); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, w: q.width, h: q.height }; }, sel); await p.waitForTimeout(900); const buf = await p.screenshot({ clip: { x: r.x + r.w * .1, y: Math.max(0, r.y) + 10, width: 40, height: 40 } }); return buf.length; };
    const colours = () => p.evaluate(() => [...document.querySelectorAll('.kws-shader')].slice(0, 2).concat([document.querySelector('.cta-band .kws-shader')]).map(el => { const cs = getComputedStyle(el); return el.dataset.shader + ':' + ['--kws-s1', '--kws-s2', '--kws-s3'].map(v => cs.getPropertyValue(v).trim()).join('/'); }));
    console.log('theme light vars:', JSON.stringify(await colours()));
    await p.click('#theme-toggle'); await p.waitForTimeout(800);
    console.log('theme after toggle:', await p.evaluate(() => document.documentElement.getAttribute('data-theme')), JSON.stringify(await colours()));
    await p.evaluate(() => document.querySelector('.cta-band').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(900);
    await p.screenshot({ path: 'theme-toggled-band-dark.png' });
    await p.evaluate(() => document.querySelector('#top').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(900);
    await p.screenshot({ path: 'theme-toggled-wash-dark.png' });
    // rapid toggling 20x while running
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    for (let i = 0; i < 21; i++) { await p.click('#theme-toggle'); await p.waitForTimeout(30); }
    await p.waitForTimeout(900);
    console.log('after 21 rapid toggles:', await p.evaluate(() => [document.documentElement.getAttribute('data-theme'), document.querySelectorAll('.kws-shader.is-live').length, window.__draws]), 'errors', errs.join('|') || 'none');
    await p.screenshot({ path: 'theme-toggled-wash-final.png' });
    // OS scheme flip without data-theme (portable page honours only data-theme; check the listener path does not throw)
    await p.emulateMedia({ colorScheme: 'dark' }); await p.waitForTimeout(400); await p.emulateMedia({ colorScheme: 'light' }); await p.waitForTimeout(400);
    console.log('prefers-color-scheme flips: errors', errs.join('|') || 'none');
    await c.close();
  }
  // 3. phone-variant stack torn down by a resize, then a hash link into a folder
  {
    const c = await ctx(b, { viewport: { width: 390, height: 844 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    await p.evaluate(() => { const f = document.querySelectorAll('.demo-brand .kws-folder')[2]; const a = document.createElement('span'); a.id = 'inside-third'; f.querySelector('.kws-folder-body').appendChild(a); });
    const s0 = await p.evaluate(() => ({ live: document.querySelector('.demo-brand .kws-folders').classList.contains('is-live'), tabs: document.querySelectorAll('.demo-brand [role=tab]').length }));
    await p.setViewportSize({ width: 932, height: 430 }); await p.waitForTimeout(500);
    const s1 = await p.evaluate(() => ({ live: document.querySelector('.demo-brand .kws-folders').classList.contains('is-live'), tabs: document.querySelectorAll('.demo-brand [role=tab]').length, roles: [...document.querySelectorAll('.demo-brand .kws-folder')].map(f => f.getAttribute('role')), ids: [...document.querySelectorAll('.demo-brand .kws-folder')].map(f => f.id), vis: [...document.querySelectorAll('.demo-brand .kws-folder')].map(f => getComputedStyle(f).visibility) }));
    await p.evaluate(() => { location.hash = '#inside-third'; }); await p.waitForTimeout(400);
    const s2 = await p.evaluate(() => ({ front: [...document.querySelectorAll('.demo-brand .kws-folder')].map(f => f.classList.contains('is-front')) }));
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    const s3 = await p.evaluate(() => ({ live: document.querySelector('.demo-brand .kws-folders').classList.contains('is-live'), tabs: document.querySelectorAll('.demo-brand [role=tab]').length, sel: [...document.querySelectorAll('.demo-brand [role=tab]')].map(t => t.getAttribute('aria-selected')), front: [...document.querySelectorAll('.demo-brand .kws-folder')].map(f => f.classList.contains('is-front')) }));
    console.log('phone stack: at 390', JSON.stringify(s0), '| rotated to 932', JSON.stringify(s1), '| after hash into 3rd folder', JSON.stringify(s2), '| back at 390', JSON.stringify(s3), '| page errors:', errs.join(' | ') || 'none');
    // orientation flips x10
    for (let i = 0; i < 10; i++) { await p.setViewportSize(i % 2 ? { width: 390, height: 844 } : { width: 844, height: 390 }); await p.waitForTimeout(120); }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(600);
    console.log('after 10 orientation flips:', await p.evaluate(() => ({ tablists: document.querySelectorAll('[role=tablist]').length, tabs: document.querySelectorAll('[role=tab]').length, over: document.documentElement.scrollWidth - innerWidth, canv: document.querySelectorAll('canvas').length })), 'errors:', errs.join(' | ') || 'none');
    await c.close();
  }
  // 4. band on a host whose colour is a gradient (client site), and wash over a gradient
  {
    const c = await ctx(b, { viewport: { width: 1000, height: 800 } }); const p = await c.newPage();
    await p.addInitScript(() => { try { localStorage.setItem('bare-theme', 'light'); } catch (e) {} });
    await p.goto(PORT, { waitUntil: 'commit' });
    await p.addStyleTag({ content: '.block { background: linear-gradient(135deg, #6B4A12, #3a2706) !important; }' }).catch(() => {});
    await p.waitForLoadState('load'); await p.addStyleTag({ content: '.block { background: linear-gradient(135deg, #6B4A12, #3a2706) !important; }' });
    await p.evaluate(() => { KWS.shader.refresh(); document.querySelector('.block').scrollIntoView({ block: 'center', behavior: 'instant' }); }); await p.waitForTimeout(1500);
    await p.locator('.block').screenshot({ path: 'band-on-gradient.png' });
    console.log('band on gradient host: computed bg-color', await p.evaluate(() => getComputedStyle(document.querySelector('.block')).backgroundColor), 'live', await p.evaluate(() => document.querySelector('.block .kws-shader').classList.contains('is-live')));
    await c.close();
  }
  await b.close();
  // 5. bfcache: own server without no-store, Playwright's bfcache switch removed
  {
    const KIT = path.resolve(__dirname, '..', '..', '..'), REPO = '/home/user/Knightwebstudio';
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
    const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); let f = u.startsWith('/kit/') ? path.join(KIT, u) : path.join(REPO, u); if (u === '/other.html') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end('<!doctype html><title>other</title><p>other page</p>'); } fs.stat(f, (e, st) => { if (!e && st.isDirectory()) f = path.join(f, 'index.html'); fs.readFile(f, (e2, d) => { if (e2) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }); }).listen(8793, '127.0.0.1');
    const b2 = await chromium.launch({ args: ARGS.concat(['--enable-features=BackForwardCache']), ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const c = await b2.newContext({ viewport: { width: 390, height: 844 } }); await c.route(/plausible|hcaptcha|calendly|stripe|onrender/, r => r.abort());
    const p = await c.newPage(); await p.addInitScript(draws); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
    await p.goto('http://127.0.0.1:8793/kit/light/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(1800);
    await p.evaluate(() => { document.querySelectorAll('#pricing [role=tab]')[2].click(); document.querySelector('.kws-motion').click(); });
    const st0 = await p.evaluate(() => ({ d: window.__draws, motion: document.documentElement.getAttribute('data-motion'), sel: [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true') }));
    await p.evaluate(() => document.querySelector('.kws-motion').click()); // resume
    await p.waitForTimeout(500);
    await p.goto('http://127.0.0.1:8793/other.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    await p.goBack({ waitUntil: 'load' }).catch(e => console.log('goBack', e.message.slice(0, 80))); await p.waitForTimeout(1500);
    const a = await p.evaluate(() => window.__draws); await p.waitForTimeout(2000);
    const st1 = await p.evaluate(() => ({ persisted: window.__persisted, d: window.__draws, motion: document.documentElement.getAttribute('data-motion'), sel: [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true'), live: document.querySelectorAll('.kws-shader.is-live').length, tablists: document.querySelectorAll('[role=tablist]').length, btn: document.querySelector('.kws-motion').getAttribute('aria-label') }));
    console.log('bfcache: before', JSON.stringify(st0), '| after back', JSON.stringify(st1), `| draws in 2s after restore: ${st1.d - a}`, '| errors:', errs.join(' | ') || 'none');
    // other tab changed the stored choice while this page was in bfcache? (storage sync)
    await b2.close(); srv.close();
  }
})();
