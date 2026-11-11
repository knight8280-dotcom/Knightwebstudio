const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' });
  const dead = await p.evaluate(() => {
    const sheet = [...document.styleSheets].find(s => /pages\/home\.css/.test(s.href || '')); const out = []; let n = 0;
    const walk = rules => { for (const r of rules) { if (r.cssRules && r.type !== 1) { walk(r.cssRules); continue; } if (r.type !== 1) continue; n++; for (const sel of r.selectorText.split(/,(?![^(]*\))/)) { const s = sel.trim().replace(/::?(before|after|marker)/g, ''); let c = -1; try { c = document.querySelectorAll(s).length; } catch (e) {} if (c === 0) out.push(sel.trim()); } } };
    walk(sheet.cssRules); return { n, out };
  });
  console.log('home.css style rules:', dead.n, 'selectors matching nothing:'); dead.out.forEach(s => console.log('   ' + s));
  for (const w of [1100, 1120, 1140, 1160, 1280, 1290, 1300, 1440, 1920]) {
    const res = {};
    for (const path of ['/', '/pricing/']) {
      await p.setViewportSize({ width: w, height: 800 }); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => scrollTo(0, 400)); await p.waitForTimeout(500);
      res[path] = await p.evaluate(() => ({ links: [...document.querySelectorAll('.nav-links a')].map(a => Math.round(a.getBoundingClientRect().left)), cta: Math.round(document.querySelector('.header-cta').getBoundingClientRect().height), ctaL: Math.round(document.querySelector('.header-cta').getBoundingClientRect().left), tel: (() => { const t = document.querySelector('.header-tel, .site-header a[href^="tel:"]'); if (!t) return null; const r = t.getBoundingClientRect(); const cs = getComputedStyle(t); return `${Math.round(r.left)}..${Math.round(r.right)} h${Math.round(r.height)} op${cs.opacity} ${cs.visibility}`; })(), navW: Math.round(document.querySelector('.nav').getBoundingClientRect().width), hdrH: Math.round(document.querySelector('.site-header').getBoundingClientRect().height) }));
    }
    const d = res['/'].links.map((x, i) => x - res['/pricing/'].links[i]);
    console.log(`${w}: home cta h${res['/'].cta} tel ${res['/'].tel} hdr ${res['/'].hdrH} | pricing cta h${res['/pricing/'].cta} tel ${res['/pricing/'].tel} hdr ${res['/pricing/'].hdrH} | menu link x shift home-pricing: ${d.join(',')}`);
  }
  await b.close();
})();
