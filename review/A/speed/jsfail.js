// main.js blocked, or slow: what stays hidden, for how long, and does the four-second fail-safe work?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const MODE = process.argv[2] || 'blocked'; // blocked | slow
const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const eff = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  const hidden = [...document.querySelectorAll('.reveal')].filter(el => vis(el) && eff(el) < 0.5);
  const d = el => (el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '')) + ' "' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '"';
  const nav = document.getElementById('nav'), tt = document.getElementById('theme-toggle'), nt = document.getElementById('nav-toggle');
  return { cls: document.documentElement.className, ready: !!window.kwsReady, reveals: document.querySelectorAll('.reveal').length, hiddenAll: hidden.length, hiddenInView: hidden.filter(inView).map(d), navLinksVisible: nav ? [...nav.querySelectorAll('.nav-links a')].filter(a => vis(a) && eff(a) > .5 && inView(a)).length : null, themeToggle: tt ? vis(tt) : null, navToggle: nt ? vis(nt) : null, mainTop: Math.round(document.querySelector('main').getBoundingClientRect().top + scrollY), headerPos: (() => { const h = document.querySelector('.site-header'); return h ? getComputedStyle(h).position : null; })() };
};
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh] of [[390, 844], [1280, 800]]) {
    for (const p of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500 });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      if (MODE === 'blocked') await ctx.route('**/assets/js/main.js', r => r.abort());
      else await ctx.route('**/assets/js/main.js', async r => { await sleep(6500); r.continue(); });
      await ctx.addInitScript(() => { window.__ls = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime) }); }).observe({ type: 'layout-shift', buffered: true }); });
      const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
      await page.goto('http://localhost:8720' + p, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(1500); const a = await page.evaluate(probe);
      if (process.argv.includes('--shots') && ['/', '/pricing/', '/contact/'].includes(p)) { const cdp = await ctx.newCDPSession(page); const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${__dirname}/shots/js${MODE}-${p.replace(/\W/g, '') || 'home'}-${vw}-t1.5.png`, Buffer.from(data, 'base64')); }
      await sleep(3200); const b = await page.evaluate(probe); // t = 4.7s
      if (process.argv.includes('--shots') && ['/', '/pricing/', '/contact/'].includes(p)) { const cdp = await ctx.newCDPSession(page); const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${__dirname}/shots/js${MODE}-${p.replace(/\W/g, '') || 'home'}-${vw}-t4.7.png`, Buffer.from(data, 'base64')); }
      let c = null, flick = null;
      if (MODE === 'slow') {
        // sample the opacity of in-view reveal blocks every frame while main.js arrives (t ~ 6.5s)
        flick = await page.evaluate(() => new Promise(res => { const els = [...document.querySelectorAll('.reveal')].filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.height > 0; }); let min = 1, minEl = '', t0 = performance.now(), frames = 0, below = 0; const tick = () => { frames++; let any = false; for (const el of els) { const o = parseFloat(getComputedStyle(el).opacity); if (o < min) { min = o; minEl = el.className; } if (o < 0.9) any = true; } if (any) below++; if (performance.now() - t0 < 3300) requestAnimationFrame(tick); else res({ inViewReveals: els.length, minOpacity: +min.toFixed(2), minEl, framesBelow90: below, frames }); }; requestAnimationFrame(tick); }));
        c = await page.evaluate(probe);
      }
      const ls = await page.evaluate(() => window.__ls);
      console.log(`${(p + '@' + vw).padEnd(32)} t=1.5s class="${a.cls}" reveals=${a.reveals} hidden=${a.hiddenAll} hiddenInFirstScreen=${a.hiddenInView.length} navLinks=${a.navLinksVisible} toggles=${a.themeToggle}/${a.navToggle} | t=4.7s class="${b.cls}" hidden=${b.hiddenAll} navLinks=${b.navLinksVisible} toggles=${b.themeToggle}/${b.navToggle} mainTop ${a.mainTop}→${b.mainTop} header ${a.headerPos}→${b.headerPos}` + (c ? ` | after main.js class="${c.cls}" hidden=${c.hiddenAll} hiddenInView=${c.hiddenInView.length} mainTop=${c.mainTop} flicker=${JSON.stringify(flick)}` : '') + ` | shifts ${JSON.stringify(ls.filter(e => e.v >= 0.005))}` + (errs.length ? ' ERR ' + errs.join(';') : ''));
      if (a.hiddenInView.length) console.log('      hidden in first screen until fail-safe: ' + a.hiddenInView.slice(0, 6).join(' | '));
      await ctx.close();
    }
  }
  await browser.close();
})();
