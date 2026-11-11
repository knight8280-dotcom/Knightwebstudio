const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, tag] of [[390, 844, 'm'], [1280, 800, 'l'], [1366, 620, 'short']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/terms/'); await p.waitForTimeout(500);
    await p.click('.toc a[href="#care-plans"]'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const h = document.querySelector('#care-plans').getBoundingClientRect(); const hd = document.querySelector('.site-header').getBoundingClientRect(); const t = document.querySelector('.toc').getBoundingClientRect();
      return { headingTop: Math.round(h.top), headerBottom: Math.round(hd.bottom), tocTop: Math.round(t.top), tocBottom: Math.round(t.bottom), vh: innerHeight, hash: location.hash }; });
    console.log(tag, JSON.stringify(r));
    await p.screenshot({ path: `${process.argv[2]}/anchor-${tag}.png` });
    await ctx.close();
  }
  await b.close();
})();
