// Does focusing a control in the sticky header move the page? Raw input only (no Playwright auto-scroll).
const { chromium, BASE, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const y = () => 'scrollY=' + 0;
  for (const [w, h, mobile] of [[390, 844, true], [820, 1000, false], [1280, 800, false]]) {
    const ctx = await ctxFor(b, { w, h, reduced: true, mobile }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
    const sy = () => p.evaluate(() => Math.round(scrollY));
    await p.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(400);
    const log = [`start ${await sy()}`];
    if (w < 1100) {
      const box = await p.evaluate(() => { const r = document.getElementById('nav-toggle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      if (mobile) await p.touchscreen.tap(box[0], box[1]); else await p.mouse.click(box[0], box[1]);
      await p.waitForTimeout(500); log.push(`raw ${mobile ? 'tap' : 'click'} opens menu: ${await sy()} open=${await p.getAttribute('#nav-toggle', 'aria-expanded')} active=${await p.evaluate(() => document.activeElement.textContent.trim().slice(0, 12))}`);
      await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200); log.push(`3x Tab inside the open menu: ${await sy()}`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(500); log.push(`Escape closes: ${await sy()}`);
      await p.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(300);
      if (mobile) await p.touchscreen.tap(box[0], box[1]); else await p.mouse.click(box[0], box[1]); await p.waitForTimeout(450); const o = await sy();
      if (mobile) await p.touchscreen.tap(box[0], box[1]); else await p.mouse.click(box[0], box[1]); await p.waitForTimeout(450); log.push(`reset to 3000; raw open then raw close: ${o} then ${await sy()}`);
    }
    await p.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(300);
    const tb = await p.evaluate(() => { const r = document.getElementById('theme-toggle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.click(tb[0], tb[1]); await p.waitForTimeout(300); log.push(`reset to 3000; raw click on theme toggle: ${await sy()}`);
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(250); log.push(`then Shift+Tab (focus stays in header): ${await sy()} active=${await p.evaluate(() => (document.activeElement.textContent || document.activeElement.getAttribute('aria-label')).trim().slice(0, 16))}`);
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(250); log.push(`Shift+Tab again: ${await sy()}`);
    await p.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('theme-toggle').focus()); await p.waitForTimeout(250); log.push(`reset to 3000; script focus() on theme toggle: ${await sy()}`);
    console.log(`${w}x${h}: ` + log.join('\n      '));
    console.log('      scroll-padding: ' + await p.evaluate(() => getComputedStyle(document.documentElement).scrollPadding) + ' header height ' + await p.evaluate(() => document.getElementById('site-header').offsetHeight));
    // same test with scroll-padding removed, to prove the cause
    await p.addStyleTag({ content: 'html{scroll-padding:0 !important}' }); await p.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('theme-toggle').focus()); await p.waitForTimeout(250); console.log(`      with scroll-padding:0 -> script focus() on theme toggle: ${await sy()}`);
    await ctx.close();
  }
  await b.close();
})();
