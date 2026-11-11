const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(300);
  const op = async () => p.evaluate(() => getComputedStyle(document.getElementById('nav')).opacity + '/' + getComputedStyle(document.getElementById('nav')).visibility);
  const o = [await op()]; await p.click('#nav-toggle'); await p.waitForTimeout(50); o.push(await op()); await p.waitForTimeout(400); o.push(await op());
  await p.click('#nav-toggle'); await p.waitForTimeout(60); o.push(await op()); await p.waitForTimeout(400); o.push(await op());
  console.log('menu opacity: closed', o[0], '| 50ms after opening', o[1], '| open', o[2], '| 60ms after closing', o[3], '| closed', o[4]);
  // desktop round trip after use: 390 -> 1440 -> 1000 must not flash
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(200); await p.setViewportSize({ width: 1000, height: 900 }); const f = [await op()]; await p.waitForTimeout(80); f.push(await op());
  console.log('after use, 1440 -> 1000:', f.join('  '), '| nav-anim present:', await p.evaluate(() => document.getElementById('nav').classList.contains('nav-anim')));
  // every page: console errors on load and scroll, at phone and desktop
  const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
  for (const w of [390, 1440]) { await p.setViewportSize({ width: w, height: 900 }); for (const path of PAGES) { await p.goto('http://localhost:8720' + path); await p.waitForTimeout(150); await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(150); } }
  console.log('console and page errors on 19 pages x 2 widths:', errs.length, errs.slice(0, 5)); await b.close(); })();
