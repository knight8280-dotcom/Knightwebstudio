// Frame times while a finger scrolls the last 2,600px of the pricing page (its last section, the closing band, the
// footer, to the very end), at 390x844 with the CPU throttled 4x, and unthrottled for reference. Three pages, taken
// in turn so they share whatever else the machine is doing:
//   today    the page as it stands in the repository (old band, old footer)
//   kit      the same page with the new band and footer, CSS only
//   kit+bg   the same, with the "band" shader live in the band and in the footer sky
// Also: animation frames asked for while nothing is touched.     node perf.js [passes]
const { chromium } = require('playwright');
const PASSES = +process.argv[2] || 3;
const PAGES = [['today ', 'http://localhost:8730/pricing/', false], ['kit   ', 'http://localhost:8730/kit/closing/test/pricing-with-kit.html', false], ['kit+bg', 'http://localhost:8730/kit/closing/test/pricing-with-kit.html', true]];
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const run = async (url, shader, rate) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__raf++; return r.call(window, f); }; try { localStorage.setItem('kws-motion', 'on'); } catch (e) {} });
    const p = await ctx.newPage();
    if (!shader) await p.route('**/shader.js', r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight - innerHeight - 2600); });
    await p.waitForTimeout(500);
    const r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(2000); const idle = (await p.evaluate(() => window.__raf)) - r0;
    // a raw frame loop records the time of every frame while the finger moves
    await p.evaluate(() => { window.__t = []; window.__on = true; const loop = now => { window.__t.push(now); if (window.__on) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    for (let n = 0; n < 9; n++) {   // swipes of 520px in 26 moves, then the last fling settles
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700, id: 1 }] });
      for (let i = 1; i <= 26; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - 20 * i, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(120);
    }
    await p.waitForTimeout(900);
    const t = await p.evaluate(() => { window.__on = false; return window.__t; });
    const left = await p.evaluate(() => Math.round(document.documentElement.scrollHeight - innerHeight - scrollY));
    await ctx.close();
    return { d: t.slice(1).map((x, i) => x - t[i]), idle, left };
  };
  await run(PAGES[1][1], true, 1);   // warm the browser up (fonts, caches, the GPU process); not reported
  for (const rate of [1, 4]) {
    const all = PAGES.map(() => ({ d: [], idle: 0, left: 0, worst: [] }));
    for (let k = 0; k < PASSES; k++) for (let i = 0; i < PAGES.length; i++) {
      const r = await run(PAGES[i][1], PAGES[i][2], rate);
      all[i].d.push(...r.d); all[i].idle += r.idle; all[i].left += r.left; all[i].worst.push(Math.max(...r.d).toFixed(0));
    }
    all.forEach((a, i) => console.log(`${rate}x CPU  ${PAGES[i][0]}  ${a.d.length} frames in ${PASSES} passes: mean ${(a.d.reduce((x, y) => x + y, 0) / a.d.length).toFixed(1)}ms, median ${pct(a.d, .5).toFixed(1)}ms, p95 ${pct(a.d, .95).toFixed(1)}ms, p99 ${pct(a.d, .99).toFixed(1)}ms, over 34ms: ${a.d.filter(x => x > 34).length} (${(a.d.filter(x => x > 34).length / a.d.length * 100).toFixed(2)}%), worst per pass ${a.worst.join('/')}ms; reached the end: ${a.left === 0}; idle: ${a.idle} frames asked for in ${2 * PASSES}s`));
  }
  await b.close();
})();
