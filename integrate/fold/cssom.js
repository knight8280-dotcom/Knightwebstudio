#!/usr/bin/env node
/* What the browser parsed, before and after the fold.
   Before (frozen copy): for each page, the rules of styles.css followed by the rules of its page sheet.
   After (repository): the rules of the one styles.css.
   Proof wanted: after == shared rules + the sixteen page sheets' rules in block order, rule for rule, as the
   browser serialises them; and every page of the repository loads exactly one stylesheet with no failed request. */
const { chromium } = require('playwright');
const A = 'http://localhost:8722', B = 'http://localhost:8720';
const PAGES = { home: '/', services: '/services/', consulting: '/consulting/', work: '/work/', process: '/process/', pricing: '/pricing/', faq: '/faq/', about: '/about/',
  city: '/web-design-baton-rouge/', contact: '/contact/', privacy: '/privacy/', terms: '/terms/', checkout: '/checkout/', 'checkout-success': '/checkout/success/', start: '/start/', notfound: '/404.html' };
const ALL = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/',
  '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const dump = () => [...document.styleSheets].filter(s => s.href).map(s => ({ href: new URL(s.href).pathname, rules: [...s.cssRules].map(r => r.cssText) }));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  let shared = null; const pageRules = {}; let bad = 0;
  for (const [slug, p] of Object.entries(PAGES)) {
    await page.goto(A + p, { waitUntil: 'load' });
    const sheets = await page.evaluate(dump);
    if (sheets.length !== 2 || sheets[0].href !== '/assets/css/styles.css' || sheets[1].href !== `/assets/css/pages/${slug}.css`) { console.log('unexpected sheets before the fold on', p, sheets.map(s => s.href)); bad++; continue; }
    if (shared && JSON.stringify(shared) !== JSON.stringify(sheets[0].rules)) { console.log('shared sheet parsed differently on', p); bad++; }
    shared = sheets[0].rules; pageRules[slug] = sheets[1].rules;
  }
  const order = Object.keys(PAGES);
  const expect = shared.concat(...order.map(s => pageRules[s]));
  console.log(`before: shared sheet ${shared.length} top-level rules; page sheets ${order.map(s => s + ' ' + pageRules[s].length).join(', ')}; total ${expect.length}`);
  const failed = [];
  page.on('requestfailed', r => failed.push(r.url())); page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
  for (const p of ALL) {
    await page.goto(B + p, { waitUntil: 'load' });
    const sheets = await page.evaluate(dump);
    const links = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href')));
    const same = sheets.length === 1 && sheets[0].rules.length === expect.length && sheets[0].rules.every((r, i) => r === expect[i]);
    if (!same || links.length !== 1) {
      bad++; console.log('DIFFERS after the fold on', p, 'sheets', sheets.map(s => s.href + ' ' + s.rules.length), 'links', links);
      if (sheets[0]) { const i = sheets[0].rules.findIndex((r, j) => r !== expect[j]); console.log('  first differing rule index', i, '\n  got   ', (sheets[0].rules[i] || '').slice(0, 200), '\n  expect', (expect[i] || '').slice(0, 200)); }
    }
  }
  console.log(`after: ${ALL.length} pages checked, each with one stylesheet of ${expect.length} top-level rules; ${bad} problem(s); failed or 4xx requests: ${failed.filter(u => !/plausible|hcaptcha|calendly|stripe|onrender/.test(u)).length}`);
  failed.filter(u => !/plausible|hcaptcha|calendly|stripe|onrender/.test(u)).forEach(u => console.log('  ', u));
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
