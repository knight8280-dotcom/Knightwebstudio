// Is will-change earning its place? Spotlight only, 390x844 at 2x, CPU 4x: as shipped, never promoted, always promoted.
const { chromium } = require('playwright');
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const [label, css] of [['as shipped', ''], ['never promoted', '.is-moving .kws-spot-frame,.is-moving .kws-arc-tile{will-change:auto}'], ['always promoted', '.kws-spot-frame,.kws-arc-tile{will-change:transform,opacity}']]) for (let run = 0; run < 2; run++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); if (css) await p.addStyleTag({ content: css }); await p.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const out = [];
    for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spotlight', '#work .kws-spot', '.kws-spot-frame']]) {
      await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); }, sel); await p.waitForTimeout(600);
      const record = () => p.evaluate(s => new Promise(done => { const el = document.querySelector(s), t = []; let seen = false, quiet = 0;
        const loop = now => { const m = el.classList.contains('is-moving'); if (m) { seen = true; t.push(now); quiet = 0; } else if (seen && ++quiet > 3) return done(t); else if (!seen && ++quiet > 240) return done(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }), sel);
      const stats = t => { const d = t.slice(1).map((x, i) => x - t[i]); return `${d.length}f mean ${(d.reduce((a, c) => a + c, 0) / d.length).toFixed(1)} 95th ${pct(d, .95).toFixed(1)} worst ${Math.max(...d).toFixed(1)} long ${d.filter(x => x > 33.4).length}`; };
      let rec = record(); await p.waitForTimeout(60); await p.evaluate(s => document.querySelector(s + ' button:last-of-type').click(), sel); const a = stats(await rec); await p.waitForTimeout(300);
      const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30;
      rec = record(); await p.waitForTimeout(60);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 40; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 150 * Math.sin(i / 40 * Math.PI * 1.5), y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); const d = stats(await rec);
      out.push(`${name}: next [${a}] drag [${d}]`);
    }
    console.log(label.padEnd(16), out.join('  |  '));
    await ctx.close();
  }
  await b.close();
})();
