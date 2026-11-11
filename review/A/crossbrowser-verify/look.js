// my own look at a few pages in an old WebKit: four viewport stops side by side is too wide to stitch here, so save each stop
const { webkit } = require(process.env.PWCORE);
(async () => {
  const b = await webkit.launch();
  for (const [path, stops] of [['/', [0, 800, 1600, 2400]], ['/pricing/', [0, 800, 1600]], ['/consulting/', [800, 1600]]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    for (const y of stops) { await p.evaluate(async yy => { for (let s = scrollY; s < yy; s += 200) { scrollTo(0, s); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, yy); }, y); await p.waitForTimeout(1200); await p.screenshot({ path: `shots/look_${process.env.PWLABEL}_${path.replace(/\//g, '') || 'home'}_${y}.png` }); }
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
