const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8720';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
const has = p => p.evaluate(() => !!document.querySelector('script[src*="hcaptcha"]'));
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080], [820, 1180], [390, 844], [360, 640], [2560, 1440]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx); const p = await ctx.newPage();
    await p.goto(base + '/contact/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    const early = await has(p);
    const slot = await p.evaluate(() => { const r = document.getElementById('hcaptcha-slot').getBoundingClientRect(); return [Math.round(r.top), innerHeight]; });
    // scroll the slot into view: requested then?
    await p.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' })); await p.waitForTimeout(400);
    const onView = await has(p);
    await ctx.close();
    // focus path
    const ctx2 = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx2); const p2 = await ctx2.newPage();
    await p2.goto(base + '/contact/', { waitUntil: 'load' }); await p2.waitForTimeout(300);
    const before = await has(p2); await p2.focus('#name'); await p2.waitForTimeout(100); const onFocus = await has(p2);
    await ctx2.close();
    // timer path
    const ctx3 = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx3); const p3 = await ctx3.newPage();
    await p3.goto(base + '/contact/', { waitUntil: 'load' }); await p3.waitForTimeout(3300); const at33 = await has(p3); await p3.waitForTimeout(1200); const at45 = await has(p3);
    const theme = await p3.evaluate(() => document.getElementById('hcaptcha-slot').getAttribute('data-theme'));
    await ctx3.close();
    console.log(`${w}x${h}: slot top ${slot[0]} of ${slot[1]}; within 0.8s: ${early}; after scrolling it into view: ${onView}; before focus ${before}, after focus ${onFocus}; idle at 3.3s ${at33}, at 4.5s ${at45}; data-theme ${theme}`);
  }
  await b.close();
})();
