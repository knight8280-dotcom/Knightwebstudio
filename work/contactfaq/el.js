// node el.js URL SELECTOR OUT [width] [theme] [height]  : screenshot one element (or full page if SELECTOR is "page")
const { chromium } = require('playwright');
(async () => {
  const [url, sel, out, w = '390', theme = 'light', h = '844'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme, isMobile: +w < 700, hasTouch: +w < 700 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));
  await p.waitForTimeout(600);
  if (sel === 'page') await p.screenshot({ path: out, fullPage: true });
  else await p.locator(sel).first().screenshot({ path: out });
  console.log(out, await p.evaluate(() => document.documentElement.scrollHeight));
  await b.close();
})();
