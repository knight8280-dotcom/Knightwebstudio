// node snap.js OUT.png WIDTH [selector|full|top] [theme] [height] [engine]
// Screenshot of one element (padded), the first screen ("top") or the full page.
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const [out, w = '390', what = 'top', theme = 'light', h = '', engine = 'chromium'] = process.argv.slice(2);
  const width = parseInt(w, 10), height = parseInt(h || (width < 700 ? '844' : '900'), 10);
  const b = await pw[engine].launch();
  const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme, deviceScaleFactor: 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(process.env.URL || 'http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important} html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(500);
  if (what !== 'top') await p.addStyleTag({ content: '.site-header{position:static!important}.mobile-cta{display:none!important}' });
  if (what === 'full') await p.screenshot({ path: out, fullPage: true });
  else if (what === 'top') await p.screenshot({ path: out });
  else {
    const el = p.locator(what).first();
    await el.scrollIntoViewIfNeeded();
    const box = await el.boundingBox();
    const pad = 24, sy = await p.evaluate(() => scrollY);
    await p.screenshot({ path: out, fullPage: true, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y + sy - pad), width: Math.min(width - Math.max(0, box.x - pad), box.width + 2 * pad), height: box.height + 2 * pad } });
  }
  console.log(out, await p.evaluate(() => document.documentElement.scrollHeight));
  await b.close();
})();
