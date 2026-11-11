// Does the proposed one-line change to main.js bring the phone bar's behaviour back? (main.js is patched in flight; no file is changed.)
const { launch, BLOCK } = require('./common');
const fs = require('fs');
(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await c.route(BLOCK, r => r.abort());
  const src = fs.readFileSync('/home/user/Knightwebstudio/assets/js/main.js', 'utf8');
  const patched = src.replace("document.querySelector('.cta-band')", "document.querySelector('.cta-band, .kws-close')");
  console.log('patched main.js differs from the original:', patched !== src);
  await c.route(/assets\/js\/main\.js/, r => r.fulfill({ contentType: 'text/javascript', body: patched }));
  const p = await c.newPage();
  await p.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html', { waitUntil: 'load' }); await p.waitForTimeout(900);
  const out = [];
  for (const frac of [-0.2, 0.15, 0.5, 0.85]) {
    const r = await p.evaluate(async frac => { document.documentElement.style.scrollBehavior = 'auto'; const band = document.querySelector('.kws-close'), q = band.getBoundingClientRect(); scrollTo(0, q.top + scrollY + q.height * frac - innerHeight * 0.5); await new Promise(r => setTimeout(r, 500)); return document.getElementById('mobile-cta').classList.contains('show'); }, frac);
    out.push(`band ${Math.round(frac * 100)}% -> bar shown ${r}`);
  }
  console.log(out.join(' | '));
  await b.close();
})();
