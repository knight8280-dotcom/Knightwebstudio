const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [820, 1180], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'commit' }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => { const r = e.getBoundingClientRect(); return (e.className.toString().replace(/ ?(reveal|visible) ?/g, ' ').trim() || 'notes>div') + ' top ' + Math.round(r.top) + (r.top < innerHeight ? ' IN FIRST SCREEN (opacity ' + getComputedStyle(e).opacity + ')' : ''); }));
    console.log(w + 'x' + h, JSON.stringify(r)); await ctx.close(); }
  await b.close(); })();
