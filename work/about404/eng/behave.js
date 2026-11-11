// Behaviour on /about/ and /404.html at 390 and 1440.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const OUT = __dirname + '/bshots';
require('fs').mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra !== undefined ? '   ' + JSON.stringify(extra) : '')); if (!cond) failed++; };

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const watch = (p, tag) => { p.on('pageerror', e => errors.push(tag + ' pageerror ' + e)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(tag + ' console.' + m.type() + ' ' + m.text() + ' @' + (m.location().url || '')); }); p.on('response', r => { if (r.status() >= 400) errors.push(tag + ' ' + r.status() + ' ' + r.url()); }); p.on('requestfailed', r => errors.push(tag + ' requestfailed ' + r.url() + ' ' + (r.failure() || {}).errorText)); };

  // ===== about 1440
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
    const p = await ctx.newPage(); watch(p, 'about1440');
    const reqs = []; p.on('request', r => reqs.push(r.url()));
    await p.goto(BASE + '/about/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    ok('about1440 data-page', await p.getAttribute('body', 'data-page') === 'about');
    ok('about1440 aria-current on About in the menu', await p.evaluate(() => { const a = [...document.querySelectorAll('#nav a[aria-current="page"]')]; return a.length === 1 && a[0].getAttribute('href') === '/about/'; }));
    const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.textContent.trim().replace(/\s+/g, ' '), a.href, a.target, a.rel, !!a.closest('main')]));
    ok('about1440 booking buttons rewritten', bk.every(x => x[1] === 'https://calendly.com/knightwebstudio1/30min' && x[2] === '_blank' && x[3] === 'noopener'), bk);
    ok('about1440 theme toggle', await (async () => { await p.click('#theme-toggle'); const d = await p.getAttribute('html', 'data-theme'); const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); await p.screenshot({ path: OUT + '/about1440-dark-top.png' }); await p.click('#theme-toggle'); return d === 'dark' && bg === 'rgb(19, 23, 34)' && await p.getAttribute('html', 'data-theme') === 'light'; })());
    ok('about1440 no phone bar visible', !(await p.isVisible('#mobile-cta')));
    ok('about1440 #year', await p.textContent('#year') === String(new Date().getFullYear()));
    ok('about1440 #about anchor resolves', await p.evaluate(() => !!document.getElementById('about')));
    await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(700);
    ok('about1440 header scrolled + header tel visible', await p.evaluate(() => document.getElementById('site-header').classList.contains('scrolled')) && await p.isVisible('.header-tel'));
    // reveal: scroll to bottom quickly; are all reveals visible after 1s?
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1200);
    const rv = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => [e.className, getComputedStyle(e).opacity, Math.round(e.getBoundingClientRect().top)]));
    console.log('   reveals after jump to bottom:', JSON.stringify(rv));
    // external scripts requested
    console.log('   external requests:', [...new Set(reqs.filter(u => !u.startsWith(BASE)))]);
    console.log('   local requests:', [...new Set(reqs.filter(u => u.startsWith(BASE)).map(u => u.replace(BASE, '')))].join(' '));
    await ctx.close();
  }
  // ===== about 390
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
    const p = await ctx.newPage(); watch(p, 'about390');
    await p.goto(BASE + '/about/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    ok('about390 phone bar hidden on first screen', await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show')));
    await p.click('#nav-toggle'); await p.waitForTimeout(450);
    ok('about390 menu opens', await p.isVisible('#nav') && await p.getAttribute('#nav-toggle', 'aria-expanded') === 'true');
    ok('about390 menu: About is current', await p.evaluate(() => { const a = document.querySelector('#nav [aria-current="page"]'); return a && a.textContent.trim() === 'About'; }));
    await p.screenshot({ path: OUT + '/about390-menu.png' });
    await p.keyboard.press('Escape'); await p.waitForTimeout(450);
    ok('about390 menu closes on Escape', !(await p.isVisible('#nav')) && await p.getAttribute('#nav-toggle', 'aria-expanded') === 'false');
    ok('about390 page unlocked after close', await p.evaluate(() => document.body.style.overflow !== 'hidden' && !document.querySelector('main').inert));
    // sticky bar: scroll step by step, record whether it shows and what it covers
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    const cover = [];
    for (let y = 0; y <= H - 844; y += 211) {
      await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(380);
      const r = await p.evaluate(() => { const bar = document.getElementById('mobile-cta'); const show = bar.classList.contains('show'); const br = bar.getBoundingClientRect(); const hit = [];
        if (show) for (const el of document.querySelectorAll('main a, main button, main .btn')) { const r = el.getBoundingClientRect(); if (r.height && r.bottom > br.top && r.top < innerHeight) hit.push(el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) + ' [' + Math.round(r.top) + '-' + Math.round(r.bottom) + ' vs bar ' + Math.round(br.top) + ']'); }
        const foot = document.querySelector('.site-footer').getBoundingClientRect(); const cta = document.querySelector('.cta-band').getBoundingClientRect();
        return { show, barTop: Math.round(br.top), hit, footTop: Math.round(foot.top), ctaTop: Math.round(cta.top) }; });
      cover.push({ y, ...r });
    }
    console.log('   sticky bar by scroll position:'); cover.forEach(c => console.log('    y=' + c.y + ' show=' + c.show + ' barTop=' + c.barTop + ' ctaTop=' + c.ctaTop + ' footTop=' + c.footTop + (c.hit.length ? ' PARTLY UNDER BAR: ' + c.hit.join('; ') : '')));
    // bottom of the page: is the last line covered?
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600);
    ok('about390 phone bar hidden at the very bottom', await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show')));
    await p.screenshot({ path: OUT + '/about390-bottom.png' });
    // closing band buttons: position where bar shows while the "Send an enquiry" button is at the bottom of the screen
    const pos = await p.evaluate(() => { const a = [...document.querySelectorAll('.cta-band .btn')].pop(); return a.getBoundingClientRect().bottom + scrollY; });
    await p.evaluate(y => scrollTo(0, y - 844 + 10), pos); await p.waitForTimeout(600);
    const st = await p.evaluate(() => { const bar = document.getElementById('mobile-cta'); const a = [...document.querySelectorAll('.cta-band .btn')].pop().getBoundingClientRect(); return { show: bar.classList.contains('show'), barTop: Math.round(bar.getBoundingClientRect().top), btnBottom: Math.round(a.bottom), footerTop: Math.round(document.querySelector('.site-footer').getBoundingClientRect().top) }; });
    console.log('   with the closing band\'s last button at the bottom edge:', JSON.stringify(st));
    await p.screenshot({ path: OUT + '/about390-cta-edge.png' });
    // tap the booking button in the bar
    const barLinks = await p.evaluate(() => [...document.querySelectorAll('#mobile-cta a')].map(a => [a.textContent.trim().replace(/\s+/g, ' '), a.getAttribute('href'), a.target]));
    console.log('   phone bar links:', JSON.stringify(barLinks));
    await ctx.close();
  }
  // ===== 404
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 500, hasTouch: w < 500 });
    const p = await ctx.newPage(); watch(p, '404-' + w);
    const reqs = []; p.on('request', r => reqs.push(r.url()));
    await p.goto(BASE + '/404.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    ok(`404@${w} loads no external script`, !reqs.some(u => /\.js(\?|$)/.test(u)), reqs.map(u => u.replace(BASE, '')));
    ok(`404@${w} no script-dependent controls`, await p.evaluate(() => !document.querySelector('#theme-toggle, #nav-toggle, #mobile-cta, [data-booking], .reveal, .seq')));
    const before = await p.evaluate(() => ({ cls: document.documentElement.className, h: document.documentElement.scrollHeight, hdr: getComputedStyle(document.querySelector('.site-header')).position, h1: Math.round(document.querySelector('h1').getBoundingClientRect().top) }));
    await p.waitForTimeout(4200);
    const after = await p.evaluate(() => ({ cls: document.documentElement.className, h: document.documentElement.scrollHeight, hdr: getComputedStyle(document.querySelector('.site-header')).position, h1: Math.round(document.querySelector('h1').getBoundingClientRect().top) }));
    console.log(`   404@${w} before 4s:`, JSON.stringify(before), ' after 4s:', JSON.stringify(after));
    ok(`404@${w} nothing moves when the head script drops .js after 4s`, before.h === after.h && before.h1 === after.h1);
    await ctx.close();
  }
  // ===== 404 served for a deep missing URL
  {
    const http = require('http'), fs = require('fs'), pathm = require('path');
    const ROOT = '/home/user/Knightwebstudio';
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
    const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); let f = pathm.join(ROOT, u); if (u.endsWith('/')) f = pathm.join(f, 'index.html');
      fs.readFile(f, (e, d) => { if (e) { fs.readFile(ROOT + '/404.html', (e2, d2) => { res.writeHead(404, { 'content-type': 'text/html' }); res.end(d2); }); } else { res.writeHead(200, { 'content-type': types[pathm.extname(f)] || 'application/octet-stream' }); res.end(d); } }); }).listen(8799);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(); const bad = [];
    p.on('response', r => { if (r.status() >= 400 && !/deep\/missing/.test(r.url())) bad.push(r.status() + ' ' + r.url()); });
    const resp = await p.goto('http://localhost:8799/some/deep/missing/page/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    ok('404 deep: status 404 and styled', resp.status() === 404 && await p.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(246, 240, 228)' && getComputedStyle(document.querySelector('h1')).fontFamily.includes('Fraunces')));
    ok('404 deep: no failed sub-requests', bad.length === 0, bad);
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
    ok('404 deep: every href is root-absolute, tel: or mailto:', links.every(h => /^(\/|tel:|mailto:|#main$)/.test(h)), links);
    const assets = await p.evaluate(() => [...document.querySelectorAll('link[href], script[src], img[src], use[href]')].map(e => e.getAttribute('href') || e.getAttribute('src')));
    ok('404 deep: every asset URL is root-absolute', assets.every(h => h.startsWith('/')), assets);
    for (const h of [...new Set(links.filter(h => h.startsWith('/')))]) { const r = await p.request.get('http://localhost:8799' + h); ok('404 deep: link ' + h + ' → ' + r.status(), r.status() === 200); }
    // fonts loaded?
    ok('404 deep: fonts load', await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(f => f.status === 'loaded').length >= 2; }));
    await ctx.close(); srv.close();
  }
  console.log('\nconsole/network problems:', errors.length ? errors : 'none');
  console.log(failed ? failed + ' FAILED' : 'all behaviour checks passed');
  await b.close();
})();
