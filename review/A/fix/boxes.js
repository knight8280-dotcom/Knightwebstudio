// Compare every box in the forms (contact form, calculator) between HEAD css and the working css
const { webkit, firefox, chromium } = require(process.env.PWCORE);
const fs = require('fs');
const eng = { webkit, firefox, chromium }[process.env.ENGINE];
const head = fs.readFileSync(__dirname + '/styles.head.css');
(async () => {
  const b = await eng.launch();
  let worst = 0, n = 0;
  for (const path of ['/contact/', '/consulting/']) for (const w of [360, 390, 600, 820, 1000, 1100, 1280, 1440]) {
    const get = async (css) => {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
      if (css) await ctx.route(/styles\.css/, r => r.fulfill({ body: css, contentType: 'text/css' }));
      const p = await ctx.newPage();
      await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
      const r = await p.evaluate(() => [...document.querySelectorAll('form *, .calc-inputs *')].map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height]; }));
      await ctx.close(); return r;
    };
    const a = await get(head), c = await get(null);
    let m = 0; a.forEach((x, i) => x.forEach((v, j) => { m = Math.max(m, Math.abs(v - c[i][j])); }));
    n += a.length; worst = Math.max(worst, m);
    if (m > 0.5) console.log(`  ${path} ${w}: max move ${m.toFixed(1)}px`);
  }
  console.log(`${process.env.ENGINE}: ${n} boxes, worst move ${worst.toFixed(2)}px`);
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 300)); process.exit(1); });
