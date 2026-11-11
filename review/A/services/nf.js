const { launch, watch } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await launch(); const out = {};
  for (const path of ['/no/such/deep/path/', '/services/typo', '/web-design-baton-rouge/a/b/c.html', '/checkout/sucess/?plan=starter-deposit', '/Pricing/']) {
    for (const [mode, w, h, theme] of [['phone', 390, 844, 'light'], ['desktop', 1280, 800, 'dark']]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mode === 'phone', hasTouch: mode === 'phone', colorScheme: theme });
      const page = await ctx.newPage(); const log = []; watch(page, log); const reqs = [];
      page.on('response', r => reqs.push(r.status() + ' ' + r.url().replace('http://localhost:8731', '')));
      const resp = await page.goto('http://localhost:8731' + path, { waitUntil: 'load' }); await page.waitForTimeout(800);
      const m = await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1').textContent, theme: document.documentElement.getAttribute('data-theme'), robots: (document.querySelector('meta[name=robots]') || {}).content, canonical: (document.querySelector('link[rel=canonical]') || {}).href || null, base: (document.querySelector('base') || {}).href || null,
        links: [...document.querySelectorAll('a[href]')].map(a => [a.getAttribute('href'), a.href]), imgs: [...document.images].map(i => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]), fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family), css: [...document.styleSheets].map(s => s.href), overflowX: document.documentElement.scrollWidth - innerWidth, scripts: [...document.scripts].map(s => s.src || 'inline'), bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 30) }));
      // every link target answers 200 from the site root
      const bad = [];
      for (const [raw, abs] of m.links) { if (/^(tel|mailto):/.test(raw)) continue; if (!raw.startsWith('/')) { bad.push('not root-absolute: ' + raw); continue; } const r = await ctx.request.get(abs.split('#')[0]); if (r.status() !== 200) bad.push(r.status() + ' ' + raw); }
      out[path + '|' + mode] = { status: resp.status(), m: { ...m, links: m.links.length }, badLinks: bad, reqs, log: log.filter(l => l.t !== 'response') };
      await page.screenshot({ path: `shots/nf__${mode}-${theme}__${path.replace(/[^a-z0-9]+/gi, '_')}.png`, fullPage: true });
      await ctx.close();
      console.log(path, mode, resp.status(), JSON.stringify({ h1: m.h1, theme: m.theme, robots: m.robots, canonical: m.canonical, fonts: m.fonts, scripts: m.scripts, overflowX: m.overflowX, links: m.links.length, badLinks: bad, imgs: m.imgs, non200: reqs.filter(r => !/^200 /.test(r)), log: log.filter(l => l.t !== 'response') }));
    }
  }
  fs.writeFileSync('nf.json', JSON.stringify(out, null, 1)); await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
