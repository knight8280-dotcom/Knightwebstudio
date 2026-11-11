// with the patched stylesheet served from the first byte: are legends full width in the builds that break?
const { webkit } = require(process.env.PWCORE); const fs = require('fs'); const fixed = fs.readFileSync(__dirname + '/styles.fixed.css', 'utf8');
(async () => {
  const b = await webkit.launch(); let bad = 0, n = 0; const seen = new Set();
  for (const [path, widths] of [['/contact/', [390, 820, 1280]], ['/consulting/', [390, 620, 820, 1040, 1280]]]) for (const w of widths) for (let i = 0; i < 4; i++) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    if (!process.env.NOFIX) await ctx.route('**/assets/css/styles.css*', r => r.fulfill({ contentType: 'text/css', body: fixed }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const m = await p.evaluate(() => [...document.querySelectorAll('fieldset')].map(f => { const l = f.querySelector('legend').getBoundingClientRect(), fr = f.getBoundingClientRect(); return [Math.round(l.width), Math.round(l.height), Math.round(fr.width), Math.round(fr.height), getComputedStyle(f).display]; }));
    for (const x of m) { n++; if (x[0] < x[2] - 1 || x[1] > 40) bad++; }
    seen.add(`${path} ${w}: ` + m.map(x => `${x[0]}x${x[1]}/${x[2]}x${x[3]}[${x[4]}]`).join(' '));
    if (i === 0 && process.env.SHOT && ((path === '/contact/' && w === 390) || (path === '/consulting/' && w === 1280))) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); }); await p.waitForTimeout(400); await p.screenshot({ path: `shots/fixed_${process.env.PWLABEL}_${w}_${path.replace(/\//g, '')}.png` }); }
    await ctx.close();
  }
  console.log(`  legends measured ${n}, broken ${bad}`); if (bad || process.env.VERBOSE) [...seen].forEach(s => console.log('    ' + s));
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
