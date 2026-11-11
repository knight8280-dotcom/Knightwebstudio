const { launch, open, end } = require('./common');
(async () => {
  const b = await launch();
  for (const [w, h] of [[360, 740], [768, 1024], [1920, 1080]]) {
    const p = await open(b, 'test/pricing-with-kit.html', { theme: 'light', ctx: { viewport: { width: w, height: h } } });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.documentElement.classList.remove('js'); });
    await p.waitForTimeout(1000);
    await end(p); await p.waitForTimeout(1200);
    const f = p.locator('footer.kws-foot'); await f.screenshot({ path: `foot-${w}.png` });
    const c = p.locator('.kws-close'); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(900); await c.screenshot({ path: `band-${w}.png` });
    await p.context().close();
  }
  await b.close();
})();
