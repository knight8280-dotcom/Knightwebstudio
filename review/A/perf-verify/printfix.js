const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8720';
let css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8');
const before = '  .topbar, .site-header, .mobile-cta, .skip-link, .cta-band, .footer-skyline { display: none; }';
if (!css.includes(before)) throw new Error('print rule not found');
css = css.replace(before, `  .topbar, .mobile-cta, .skip-link, .cta-band, .footer-skyline { display: none; }
  .btn-primary, .popular, .payplan-dep, .bubble-biz, .fig-n, .fig-legend li::before, .cal-day .new { background: none; color: #000; border: 1px solid #000; box-shadow: none; }
  .site-header { position: static; box-shadow: none; }
  .site-header .nav, .site-header .header-actions > :not(.header-tel) { display: none; }
  .header-tel { display: inline-flex; opacity: 1; visibility: visible; }`);
(async () => {
  const b = await chromium.launch();
  for (const p of ['/pricing/', '/consulting/', '/start/', '/']) {
    const ctx = await b.newContext({ viewport: { width: 816, height: 1056 } });
    const page = await ctx.newPage();
    await page.route('**/*', r => { const u = r.request().url(); if (!u.startsWith(BASE)) return r.abort(); if (u.endsWith('styles.css')) return r.fulfill({ body: css, contentType: 'text/css' }); r.continue(); });
    await page.goto(BASE + p, { waitUntil: 'load' });
    const slug = p.replace(/\//g, '') || 'home';
    await page.pdf({ path: __dirname + '/print/fix-' + slug + '.pdf', format: 'Letter' });
    await page.pdf({ path: __dirname + '/print/fix-' + slug + '-bg.pdf', format: 'Letter', printBackground: true });
    await ctx.close();
  }
  await b.close();
})();
