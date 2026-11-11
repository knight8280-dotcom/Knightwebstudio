const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  for (const [w, h, dpr] of [[390, 844, 3], [1440, 900, 2]]) for (const p of ['/', '/start/', '/work/', '/web-design-baton-rouge/']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    const fetched = []; page.on('requestfinished', r => { if (/\.(jpg|png)$/.test(r.url())) fetched.push(r.url().split('/').pop()); });
    await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const atLoad = fetched.slice();
    const info = await page.evaluate(() => [...document.images].map(i => { const r = i.getBoundingClientRect(); return { src: i.getAttribute('src').split('/').pop(), lazy: i.loading, shown: Math.round(r.width) + 'x' + Math.round(r.height), needPx: Math.round(r.width * devicePixelRatio), natural: i.naturalWidth + 'x' + i.naturalHeight, belowFold: Math.round(r.top - innerHeight), parent: i.parentElement.className }; }));
    console.log(`== ${p} ${w}@${dpr}x  fetched with the page (no scroll): ${JSON.stringify(atLoad)}  ect=${await page.evaluate(() => navigator.connection && navigator.connection.effectiveType)}`);
    for (const i of info) console.log('  ', i.src.padEnd(26), 'loading=' + i.lazy, 'shown', i.shown, 'needs', i.needPx + 'px', 'file 1200w', 'px below first screen:', i.belowFold, '(' + i.parent + ')');
    await ctx.close();
  }
  await b.close();
})();
