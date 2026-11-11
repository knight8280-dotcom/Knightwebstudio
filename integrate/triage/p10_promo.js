const { chromium } = require('playwright');
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const go = async (path, w, css) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 844 }); await p.goto(base + path, { waitUntil: 'load' }); if (css) await p.addStyleTag({ content: css }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); return p; };
  const H = p => p.evaluate(() => document.documentElement.scrollHeight);
  // P-1 on consulting
  const PL = '.pl-row{flex-wrap:nowrap}.pl-name{min-width:0}.pl-price{white-space:nowrap}';
  for (const w of [360, 390]) { const p = await go('/consulting/', w, PL); console.log('P-1 consulting', w, 'rows with the price under the name:', await p.evaluate(() => [...document.querySelectorAll('.pl-row')].filter(r => { const n = r.querySelector('.pl-name'), pr = r.querySelector('.pl-price'); return n && pr && n.getBoundingClientRect().width && pr.getBoundingClientRect().top > n.getBoundingClientRect().bottom - 4; }).length), '| rows wider than their list:', await p.evaluate(() => [...document.querySelectorAll('.pl-row')].filter(r => r.scrollWidth > r.clientWidth + 1).length)); await p.close(); }
  // P-5 on consulting
  { const p = await go('/consulting/', 1440, '@media (min-width:600px){.payplan-dep{flex:0 0 calc(var(--w) * 1% - var(--s-0))}}'); console.log('P-5 consulting 1440 deposit share with the rule:', await p.evaluate(() => { const bar = document.querySelector('.payplan-bar'), d = bar.querySelector('.payplan-dep'); return (100 * d.getBoundingClientRect().width / bar.getBoundingClientRect().width).toFixed(1) + '%'; })); await p.close(); }
  // P-12 on home
  for (const w of [360, 375, 390]) { const p = await go('/', w, '@media (max-width:599.98px){.bizcard{--crest:2rem}.bizcard-top{gap:var(--s-2)}.bizcard-top span{letter-spacing:0;word-spacing:-.1em}}'); console.log('P-12 home', w, 'tagline lines:', await p.evaluate(() => { const s = document.querySelector('.bizcard-top span'); return Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)); })); await p.close(); }
  // P-15 phone steps: page heights before and after
  const ST = '@media (max-width:599.98px){.steps>li>div{display:contents}.steps>li>div>:not(:first-child){grid-column:1/-1}}';
  for (const path of ['/', '/start/', '/contact/', '/checkout/success/', '/consulting/', '/process/', '/web-design-gonzales/']) { const a = await go(path, 390); const h0 = await H(a); await a.close(); const p = await go(path, 390, ST); console.log('P-15', path, '390 height', h0, '->', await H(p)); await p.close(); }
  // section-head-split row gap
  for (const path of ['/', '/consulting/', '/pricing/']) { const a = await go(path, 390); const h0 = await H(a); await a.close(); const p = await go(path, 390, '.section-head-split{row-gap:0}'); console.log('row-gap 0', path, '390 height', h0, '->', await H(p)); await p.close(); }
  // F1 appointment card
  { const p = await go('/pricing/', 1280, '@media (min-width:980px){.cta-inner{grid-template-columns:minmax(0,1fr) 21rem}}'); console.log('F1 appt width with the rule at 1280:', await p.evaluate(() => Math.round(document.querySelector('.cta-band .appt').getBoundingClientRect().width))); await p.close(); }
  // measure 31em: desktop heights
  for (const path of ['/', '/pricing/', '/terms/', '/about/', '/consulting/']) { const a = await go(path, 1440); const h0 = await H(a); await a.close(); const p = await go(path, 1440, ':root{--measure:31em}'); const h1 = await H(p); await p.close(); const q = await go(path, 390, ':root{--measure:31em}'); const r = await go(path, 390); console.log('measure 31em', path, '1440 height', h0, '->', h1, '| 390 height', await H(r), '->', await H(q)); await q.close(); await r.close(); }
  await b.close();
})();
