// Width of each heading string in Fraunces (as styled) vs Georgia stand-ins (Gelasio 400 / 700)
const { chromium } = require('playwright');
const fs = require('fs');
const PV = __dirname;
const BASE = 'http://localhost:8720';
const pages = ['/', '/services/', '/consulting/', '/pricing/', '/start/', '/contact/', '/about/', '/terms/', '/404.html', '/faq/', '/work/', '/process/', '/web-design-baton-rouge/'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.route('**/__f/**', r => { const f = r.request().url().split('/__f/')[1]; r.fulfill({ body: fs.readFileSync(PV + '/fonts/' + f), contentType: 'font/woff2' }); });
  const all = [];
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const res = await page.evaluate(async () => {
      const ff = new FontFace('GeoStand', 'url(/__f/gelasio-var.woff2)', { weight: '400 700' });
      await ff.load(); document.fonts.add(ff);
      const out = [];
      const c = document.createElement('canvas').getContext('2d');
      for (const h of document.querySelectorAll('h1, h2, h3, .title')) {
        const cs = getComputedStyle(h);
        if (!cs.fontFamily.includes('Fraunces')) continue;
        const txt = h.textContent.replace(/\s+/g, ' ').trim(); if (!txt) continue;
        const px = parseFloat(cs.fontSize);
        const meas = (font) => { const s = document.createElement('span'); s.textContent = txt; s.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;font-size:${px}px;letter-spacing:0;font-synthesis:none;${font}`; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
        const fr = meas(`font-family:Fraunces;font-weight:${cs.fontWeight};font-variation-settings:${cs.fontVariationSettings}`);
        const g4 = meas('font-family:GeoStand;font-weight:400');
        const g7 = meas('font-family:GeoStand;font-weight:700');
        out.push({ tag: h.tagName, w: cs.fontWeight, px, txt: txt.slice(0, 50), fr, g4, g7 });
      }
      return out;
    });
    res.forEach(r => all.push(Object.assign({ p }, r)));
  }
  const med = a => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const r4 = all.map(r => r.fr / r.g4), r7 = all.map(r => r.fr / r.g7);
  console.log('headings', all.length, 'weights', [...new Set(all.map(r => r.w))]);
  console.log('Fraunces/Georgia-regular  median', med(r4).toFixed(3), 'min', Math.min(...r4).toFixed(3), 'max', Math.max(...r4).toFixed(3));
  console.log('Fraunces/Georgia-bold     median', med(r7).toFixed(3), 'min', Math.min(...r7).toFixed(3), 'max', Math.max(...r7).toFixed(3));
  for (const r of all.filter(r => r.tag === 'H1')) console.log(r.p, JSON.stringify(r.txt), 'fr', r.fr.toFixed(1), 'reg', (r.fr / r.g4).toFixed(3), 'bold', (r.fr / r.g7).toFixed(3));
  // sanity: Georgia space is 0.241em, digits 0.614em in the real font
  const sanity = await page.evaluate(() => { const m = (t, w) => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = `position:absolute;white-space:pre;font:${w} 1000px GeoStand`; document.body.appendChild(s); const x = s.getBoundingClientRect().width; s.remove(); return x; }; return { space400: m('a a', 400) - m('aa', 400), zero400: m('0', 400), zero700: m('0', 700), n400: m('n', 400), n700: m('n', 700) }; });
  console.log('stand-in sanity (per 1000 units):', sanity);
  await b.close();
})();
