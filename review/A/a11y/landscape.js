const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const [w, h, label] of [[844, 340, 'iPhone 14 landscape, Safari bars showing'], [667, 325, 'iPhone SE landscape'], [341, 162, '1366x768 laptop at 400%'], [320, 256, '1280x1024 at 400% (WCAG reference)'], [320, 170, '1280x800 laptop at 400%'], [640, 325, '1366x768... no: 1280x~650 at 200%']]) {
    const ctx = await ctxFor(b, { w, h, reduced: true, mobile: w > 600 }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300); await p.evaluate(() => scrollTo(0, 2400)); await p.waitForTimeout(500);
    const m = await p.evaluate(() => { const hd = document.getElementById('site-header').getBoundingClientRect(); const mc = document.getElementById('mobile-cta'); const shown = mc.classList.contains('show') && getComputedStyle(mc).display !== 'none'; const sp = getComputedStyle(document.documentElement); return { header: Math.round(hd.height), bar: shown ? Math.round(mc.getBoundingClientRect().height) : 0, vh: innerHeight, padTop: parseFloat(sp.scrollPaddingTop), padBottom: parseFloat(sp.scrollPaddingBottom) }; });
    console.log(`${w}x${h} (${label}): header ${m.header}px + bar ${m.bar}px = ${m.header + m.bar}px of ${m.vh}px -> ${m.vh - m.header - m.bar}px (${Math.round(100 * (m.vh - m.header - m.bar) / m.vh)}%) left for the page; room for a focused control between the scroll paddings: ${m.vh - m.padTop - m.padBottom}px`);
    await p.screenshot({ path: `shots/zoom/sticky_${w}x${h}.png` }); await ctx.close(); }
  await b.close(); })();
