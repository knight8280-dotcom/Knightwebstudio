// Frame times for a touch scroll past the first ring on any page, 4x CPU throttle, three rounds.  node test/perf-page.js <url> [rate]   (CSS='...' adds styles to try)
const { chromium } = require('playwright');
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
const stats = t => { const d = t.slice(1).map((x, i) => x - t[i]); return `${String(d.length).padStart(3)} frames, mean ${(d.reduce((a, c) => a + c, 0) / d.length).toFixed(1)}ms, median ${pct(d, .5).toFixed(1)}, 95th ${pct(d, .95).toFixed(1)}, worst ${Math.max(...d).toFixed(1)}, over 33ms: ${d.filter(x => x > 33.4).length}`; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (let round = 0; round < 3; round++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); await p.goto(process.argv[2], { waitUntil: 'load' }); await p.waitForTimeout(700);
    if (process.env.CSS) await p.addStyleTag({ content: process.env.CSS });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.argv[3] || 4) });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('.kws-ring'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 700); }); await p.waitForTimeout(600);
    const rec = p.evaluate(() => new Promise(done => { const t = []; const end = performance.now() + 2100; const loop = now => { t.push(now); if (now < end) requestAnimationFrame(loop); else done(t); }; requestAnimationFrame(loop); }));
    for (let k = 0; k < 2; k++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 760, id: 1 }] });
      for (let i = 1; i <= 45; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 760 - i * 12, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(40);
    }
    console.log(`${process.argv[3] || 4}x  ${stats(await rec)}`);
    await ctx.close();
  }
  await b.close();
})();
