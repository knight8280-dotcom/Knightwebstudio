const { launch, open, end } = require('./common');
(async () => {
  const b = await launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const p = await open(b, 'demo.html', { theme, ctx: { viewport: { width: w, height: h } } });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.documentElement.classList.remove('js'); });
    await p.waitForTimeout(1200);
    const parts = await p.locator('.kws-close, .kws-foot, main > section .kws-appt').all();
    let i = 0;
    for (const el of parts) {
      await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
      await el.screenshot({ path: `part-${w}-${theme}-${i++}.png` });
    }
    console.log(w, theme, i, p.errs.join(' | ') || 'clean');
    await p.context().close();
  }
  await b.close();
})();
