// node between.js WIDTHS PAGES  -> between/<w>/<page>__NN.png (viewport stops, height 1100)
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8720';
const widths = process.argv[2].split(',').map(Number);
const pages = process.argv[3].split(',');
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#]/g, '_') || 'home');
(async () => {
  const browser = await chromium.launch();
  for (const w of widths) {
    const dir = __dirname + '/between/' + w; fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: w, height: 1100 }, colorScheme: 'light' });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of pages) {
      const page = await ctx.newPage(); await page.goto(BASE + p, { waitUntil: 'load' }); await page.waitForTimeout(700);
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      let n = 0;
      for (let y = 0; y < H - 40 && n < 12; y += 1000) { await page.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), y); await page.waitForTimeout(500); n++; await page.screenshot({ path: `${dir}/${slug(p)}__${String(n).padStart(2, '0')}.png` }); }
      console.log(w, p, H, n);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
