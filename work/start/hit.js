const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.write a').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const a = document.querySelector('.write a'); const rc = a.getBoundingClientRect(); const out = [];
    for (const dy of [-14, -10, -6, 0, rc.height / 2, rc.height + 6, rc.height + 10, rc.height + 14]) { const el = document.elementFromPoint(rc.left + rc.width / 2, rc.top + dy); out.push(dy.toFixed(0) + ':' + (el === a ? 'link' : el.tagName)); }
    return { h: rc.height, out };
  });
  console.log(JSON.stringify(r));
  await p.evaluate(() => { const all = [...document.querySelectorAll('a')].filter(x => x.offsetParent); const a = document.querySelector('.write a'); all[all.indexOf(a) - 1].focus(); });
  await p.keyboard.press('Tab'); await p.waitForTimeout(200);
  const box = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.screenshot({ path: __dirname + '/focus-write.png', clip: { x: 0, y: box.y - 50, width: 390, height: box.h + 100 } });
  await b.close();
})();
