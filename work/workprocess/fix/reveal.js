const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [path, w, h] of [['/work/', 390, 844], ['/process/', 390, 844], ['/work/', 1440, 900], ['/process/', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const st = () => p.evaluate(() => [...document.querySelectorAll('main .reveal')].map(e => { const r = e.getBoundingClientRect(); return (e.className.toString().replace(/\s+/g, '.')) + ' top=' + Math.round(r.top) + ' op=' + getComputedStyle(e).opacity + ' tf=' + getComputedStyle(e).transform; }));
    console.log(path, w, 'initial'); (await st()).forEach(s => console.log('   ', s));
    // scroll stepwise like a user: wheel in 300px steps
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    let log = [];
    for (let y = 0; y < H; y += 250) {
      await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(120);
      const faded = await p.evaluate(() => [...document.querySelectorAll('main .reveal')].filter(e => { const r = e.getBoundingClientRect(); const vis = r.top < innerHeight - 60 && r.bottom > 80; return vis && parseFloat(getComputedStyle(e).opacity) < 0.5; }).map(e => e.className + '@' + Math.round(e.getBoundingClientRect().top)));
      if (faded.length) log.push(y + ': ' + faded.join(' | '));
    }
    console.log('  faded-while-in-view (120ms after each 250px step):', log.length ? log : 'none');
    await ctx.close();
  }
  await b.close();
})();
