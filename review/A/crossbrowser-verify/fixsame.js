// in engines that are fine today: does the patched stylesheet move anything in the two forms?
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE]; const fs = require('fs'); const fixed = fs.readFileSync(__dirname + '/styles.fixed.css', 'utf8');
(async () => {
  const b = await eng.launch(); let diffs = 0, boxes = 0;
  for (const [path, sel, widths] of [['/contact/', 'form', [360, 390, 600, 820, 1100, 1280, 1440]], ['/consulting/', '#growth-calc', [360, 390, 599, 600, 640, 700, 820, 979, 980, 1040, 1099, 1100, 1180, 1280, 1440, 1920]]]) for (const w of widths) {
    const snap = async (useFix) => {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
      if (useFix) await ctx.route('**/assets/css/styles.css*', r => r.fulfill({ contentType: 'text/css', body: fixed }));
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
      const r = await p.evaluate(s => { const root = document.querySelector(s); return [root, ...root.querySelectorAll('*')].map((e, i) => { const r = e.getBoundingClientRect(); return `${i}:${e.tagName}.${(e.className || '').toString().split(' ')[0]}#${e.id} ${r.left.toFixed(1)},${(r.top + scrollY).toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; }); }, sel);
      r.push('docH ' + await p.evaluate(() => document.documentElement.scrollHeight));
      await ctx.close(); return r;
    };
    const a = await snap(false), f = await snap(true); boxes += a.length;
    const d = a.map((x, i) => x === f[i] ? null : `      ${x}  ->  ${f[i]}`).filter(Boolean);
    if (d.length) { diffs += d.length; console.log(`    ${path} ${w}: ${d.length} boxes differ`); d.slice(0, 6).forEach(x => console.log(x)); }
  }
  console.log(`  ${process.env.ENGINE}: ${boxes} boxes compared, ${diffs} differ`);
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
