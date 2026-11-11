const { launch, open, end } = require('./common');
(async () => {
  const b = await launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const p = await open(b, 'demo.html', { theme, ctx: { viewport: { width: w, height: h } } });
    await p.waitForTimeout(1500);
    // scroll through to trigger everything
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.documentElement.classList.remove('js'); });
    for (let y = 0; y < H; y += h) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.screenshot({ path: `shot-demo-${w}-${theme}.png`, fullPage: true });
    console.log(w, theme, H, p.errs.join(' | ') || 'clean');
    await p.context().close();
  }
  await b.close();
})();
