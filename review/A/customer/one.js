// one.js URL OUT.png [width height] [fullPage] : screenshot one URL (phone by default), third parties blocked.
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '390', h = '844', full = '0', scroll = '0'] = process.argv.slice(2);
  const b = await chromium.launch();
  const mobile = parseInt(w) < 700;
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, isMobile: mobile, hasTouch: mobile, colorScheme: 'light' });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  if (+scroll) { await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), +scroll); await page.waitForTimeout(700); }
  await page.screenshot({ path: out, fullPage: full === '1' });
  const info = await page.evaluate(() => { const s = document.getElementById('package'); return { pkgY: s ? Math.round(s.getBoundingClientRect().top + scrollY) : null, pkg: s ? s.options[s.selectedIndex].text : null, h: document.documentElement.scrollHeight }; });
  console.log(JSON.stringify(info));
  await b.close();
})();
