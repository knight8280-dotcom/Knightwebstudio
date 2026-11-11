const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  const FIX = '[data-page="about"] h1{overflow-wrap:anywhere}@media (max-width:379.98px){[data-page="about"] h1{font-size:var(--fs-h2)}}';
  for (const fix of [false, true]) for (const [w, spacing] of [[320, false], [340, false], [360, false], [379, false], [390, false], [390, true], [360, true], [320, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 700 }, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    if (fix) await p.addStyleTag({ content: FIX });
    if (spacing) await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}' });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const h1 = document.querySelector('h1'); const col = document.querySelector('.page-head-split > div').getBoundingClientRect(); const last = [...h1.querySelectorAll('.l')].pop(); const rg = document.createRange(); rg.selectNodeContents(last); const rects = [...rg.getClientRects()]; return { over: document.documentElement.scrollWidth - innerWidth, colRight: Math.round(col.right), vw: innerWidth, wordRight: Math.round(Math.max(...rects.map(x => x.right))), wordLines: new Set(rects.map(x => Math.round(x.top))).size, fs: getComputedStyle(h1).fontSize, btnRight: Math.round(document.querySelector('.page-head .btn').getBoundingClientRect().right) }; });
    console.log(fix ? 'WITH FIX ' : 'as built ', w, spacing ? 'text-spacing' : '            ', JSON.stringify(r));
    if (fix && (w === 320 || spacing)) await p.screenshot({ path: __dirname + `/lshots/fix-${w}${spacing ? '-spacing' : ''}.png` });
    await ctx.close(); }
  await b.close(); })();
