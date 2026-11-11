// node inject.js OUT.png WIDTH SELECTOR "css to inject" [theme] [height]
// Screenshot an element (or "top") after injecting trial CSS. Nothing on disk changes.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const [out, w, what, css, theme = 'light', h = ''] = process.argv.slice(2);
  const width = parseInt(w, 10), height = parseInt(h || (width < 700 ? '844' : '900'), 10);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.addStyleTag({ content: '.js .reveal{opacity:1!important;transform:none!important} html{scroll-behavior:auto!important}' + (what === 'top' ? '' : '.site-header{position:static!important}.mobile-cta{display:none!important}') + css });
  await p.waitForTimeout(400);
  if (what === 'top') await p.screenshot({ path: out });
  else {
    const el = p.locator(what).first();
    const box = await el.boundingBox();
    const pad = 24, sy = await p.evaluate(() => scrollY);
    await p.screenshot({ path: out, fullPage: true, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y + sy - pad), width: Math.min(width - Math.max(0, box.x - pad), box.width + 2 * pad), height: box.height + 2 * pad } });
  }
  console.log(out, await p.evaluate(() => document.documentElement.scrollHeight));
  await b.close();
})();
