// The moment before the scripts arrive, and what a visitor gets if they never do (kit scripts blocked; the site's own script runs).
//   node test/held.js            Chromium;  PLAYWRIGHT_BROWSERS_PATH=<motion>/.browsers-flat node test/held.js firefox
const pw = require('playwright');
(async () => {
  const name = process.argv[2] || 'chromium';
  const b = await pw[name].launch();
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/depth/demo.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700);
    const m = () => p.evaluate(() => { const el = document.querySelector('#how .kws-cyl'), c = [...el.querySelectorAll('.kws-cyl-card')];
      return { h: Math.round(el.getBoundingClientRect().height), shown: c.filter(x => getComputedStyle(x).visibility === 'visible').length, tops: [...new Set(c.map(x => Math.round(x.getBoundingClientRect().top - el.getBoundingClientRect().top)))].join(','), ring: Math.round(document.querySelector('#included .kws-ring-stage').getBoundingClientRect().height), js: document.documentElement.classList.contains('js') }; });
    const a = await m();
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#how .kws-cyl').getBoundingClientRect().top + scrollY - 90); });
    await p.screenshot({ path: `${__dirname}/../shots/held-${name}-${w}-before-script.png` });
    await p.waitForTimeout(4200);
    const z = await m();
    await p.screenshot({ path: `${__dirname}/../shots/held-${name}-${w}-script-never-came.png`, fullPage: w < 700 });
    console.log(`${name} ${w}px  held: ${JSON.stringify(a)}  after 4s without the script: ${JSON.stringify(z)}`);
    await ctx.close();
  }
  await b.close();
})();
