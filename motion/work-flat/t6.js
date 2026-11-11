const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm });
    let release; const gate = new Promise(r => release = r);
    await ctx.route(/\/(arc|spotlight)\.js/, async r => { await gate; r.continue(); });
    const p = await ctx.newPage(); p.goto('http://localhost:8730/kit/flat/demo.html#work').catch(() => {}); await p.waitForTimeout(1200);
    const rect = () => p.evaluate(() => { const f = document.querySelector('#work .kws-spot-frame').getBoundingClientRect(), l = document.querySelector('#work .kws-spot-list').getBoundingClientRect(), li = document.querySelector('#work .kws-spot-item').getBoundingClientRect(); return { live: document.querySelector('#work .kws-spot').className, frame: [f.x, f.y, f.width, f.height], list: [l.x, l.width], li: [li.x, li.width], hold: document.documentElement.className }; });
    console.log(rm, 'before', JSON.stringify(await rect()));
    release(); await p.waitForTimeout(700);
    console.log(rm, 'after ', JSON.stringify(await rect()));
    await ctx.close();
  }
  await b.close();
})();
