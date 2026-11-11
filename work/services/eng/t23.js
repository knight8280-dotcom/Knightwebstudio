const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (let run = 0; run < 3; run++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/services/#seo'); await p.waitForTimeout(run === 0 ? 650 : run === 1 ? 300 : 100);
    await p.goto('http://localhost:8720/services/#google-reviews');
    const log = [];
    for (let i = 0; i < 9; i++) { await p.waitForTimeout(500); log.push(await p.evaluate(() => { const t = document.querySelector('#google-reviews'); const f = t.closest('.reveal'); return `${(+getComputedStyle(f).opacity).toFixed(2)}${f.classList.contains('visible') ? 'v' : '-'}@y${Math.round(scrollY)},top${Math.round(f.getBoundingClientRect().top)}`; })); }
    console.log('run', run, log.join(' | '));
    console.log('   all reveals:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => [e.className.replace(' reveal', ''), Math.round(e.getBoundingClientRect().top), getComputedStyle(e).opacity]))));
    await p.screenshot({ path: `t23-run${run}.png` });
    await ctx.close();
  }
  await b.close();
})();
