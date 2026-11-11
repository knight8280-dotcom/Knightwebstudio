// node els.js <theme> <w> <h> <prefix> sel1 sel2 ...   (element screenshots with padding)
const { chromium } = require('playwright');
const [theme, w, h, prefix, ...sels] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8730/kit/light/demo.html');
  await p.waitForTimeout(1500);
  let i = 0;
  for (const sel of sels) {
    const el = p.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await p.evaluate(s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); window.scrollBy(0, r.top - 90); }, sel);
    await p.waitForTimeout(1300);
    const box = await el.boundingBox();
    const pad = 24;
    await p.screenshot({ path: `${prefix}-${i++}.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(+w - Math.max(0, box.x - pad), box.width + 2 * pad), height: Math.min(+h - Math.max(0, box.y - pad), box.height + 2 * pad) } });
  }
  await b.close();
})();
