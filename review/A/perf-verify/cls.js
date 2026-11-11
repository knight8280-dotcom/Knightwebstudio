// CLS caused by the heading-font swap alone: Fraunces held back 1.5s, shifts counted from 1.0s on.
const { chromium } = require('playwright');
const fs = require('fs');
const PV = __dirname, BASE = 'http://localhost:8720';
const css0 = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8');
const re = /@font-face \{ font-family: "Fraunces Fallback";[^}]*\}/;
const V = {
  'chrome-now (Georgia regular x101%)': css0.replace(re, m => m.replace(/src:[^;]*;/, 'src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 400;')),
  'safari-now (Georgia bold x101%)': css0.replace(re, m => m.replace(/src:[^;]*;/, 'src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700;')),
  'safari + reviewer fix (Georgia bold x109.6%)': css0.replace(re, '@font-face { font-family: "Fraunces Fallback"; src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700; size-adjust: 109.6%; ascent-override: 89%; descent-override: 23%; }'),
  'any + bold-face fix (Georgia bold x94%)': css0.replace(re, '@font-face { font-family: "Fraunces Fallback"; src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700; size-adjust: 94%; ascent-override: 104%; descent-override: 27%; }'),
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const pages = ['/', '/start/', '/pricing/', '/consulting/', '/about/', '/contact/', '/web-design-baton-rouge/', '/terms/'];
  for (const w of [375, 390]) for (const [name, css] of Object.entries(V)) {
    const line = [];
    for (const p of pages) {
      const ctx = await b.newContext({ viewport: { width: w, height: w === 375 ? 667 : 844 } });
      const page = await ctx.newPage();
      await page.addInitScript(() => { window.__s = []; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__s.push([Math.round(e.startTime), e.value]); })).observe({ type: 'layout-shift', buffered: true }); });
      await page.route('**/*', async r => {
        const u = r.request().url();
        if (!u.startsWith(BASE)) return r.abort();
        if (u.includes('/__f/')) return r.fulfill({ body: fs.readFileSync(PV + '/fonts/' + u.split('/__f/')[1]), contentType: 'font/woff2' });
        if (u.endsWith('/assets/css/styles.css')) return r.fulfill({ body: css + '\nhtml::before { content: "x"; position: absolute; left: -99px; top: 0; opacity: 0; font: 600 10px "Fraunces Fallback"; }', contentType: 'text/css' });
        if (u.includes('fraunces')) await sleep(1500);
        r.continue();
      });
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.waitForTimeout(1200);
      const s = await page.evaluate(() => window.__s); const st = await page.evaluate(() => [...document.fonts].filter(f => f.family.includes('Fallback') && f.status === 'loaded').length); if (!st) console.log('WARN stand-in not loaded', p);
      const cls = s.filter(x => x[0] >= 1000).reduce((a, x) => a + x[1], 0);
      line.push(p + ' ' + cls.toFixed(3));
      await ctx.close();
    }
    console.log(String(w), name.padEnd(46), line.join('  '));
  }
  await b.close();
})();
