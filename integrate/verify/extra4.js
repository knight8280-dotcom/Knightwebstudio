const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  { const ctx = await b.newContext({ viewport: { width: 320, height: 568 } }); await block(ctx); const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/crops/h320-b.png', clip: { x: 0, y: 0, width: 320, height: 300 } });
    await p.goto('http://localhost:8722/pricing/'); await p.waitForTimeout(400); await p.screenshot({ path: __dirname + '/crops/h320-a.png', clip: { x: 0, y: 0, width: 320, height: 300 } });
    await ctx.close(); }
  for (const [w, h, theme] of [[390, 844, 'dark'], [390, 844, 'light'], [360, 640, 'light'], [1280, 800, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' }); await block(ctx); const p = await ctx.newPage();
    await p.goto('http://localhost:8720/contact/'); await p.waitForTimeout(500);
    await p.evaluate(() => document.getElementById('submit-btn').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500);
    console.log(w, theme, 'submit button hit test:', await p.evaluate(() => { const bt = document.getElementById('submit-btn'); const r = bt.getBoundingClientRect(); const pts = [[.5,.5],[.1,.5],[.9,.5],[.5,.1],[.5,.9]].map(([fx, fy]) => { const e = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); return e === bt || bt.contains(e) ? 'ok' : (e ? e.tagName + '.' + e.className : 'null'); }); return JSON.stringify({ top: Math.round(r.top), h: Math.round(r.height), pts }); }));
    // last line of the page reachable and not covered
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
    console.log(w, theme, 'last footer line:', await p.evaluate(() => { const ls = document.querySelectorAll('.footer-bottom a, .footer-bottom p'); const l = ls[ls.length - 1]; const r = l.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 5, r.top + r.height / 2); return JSON.stringify({ bottom: Math.round(r.bottom), vh: innerHeight, hit: e && (e === l || l.contains(e) || e.contains(l)) }); }));
    await ctx.close(); }
  await b.close();
})();
