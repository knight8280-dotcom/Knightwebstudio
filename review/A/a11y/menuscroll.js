const { chromium, BASE, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const mobile of [false, true]) for (const how of ['click', 'keyboard']) {
    const ctx = await ctxFor(b, { w: 390, h: 844, reduced: false, mobile }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
    await p.evaluate(() => scrollTo({ top: 1500, behavior: 'instant' })); await p.waitForTimeout(500);
    const log = [`start scrollY=${await p.evaluate(() => scrollY)}`];
    if (how === 'click') await p.click('#nav-toggle'); else { await p.focus('#nav-toggle'); await p.keyboard.press('Enter'); }
    await p.waitForTimeout(500); log.push(`open: scrollY=${await p.evaluate(() => scrollY)} topbarInert=${await p.evaluate(() => document.querySelector('.topbar').inert)}`);
    if (how === 'click') await p.click('#nav-toggle'); else await p.keyboard.press('Escape');
    await p.waitForTimeout(700); log.push(`closed: scrollY=${await p.evaluate(() => scrollY)} active=${await p.evaluate(() => document.activeElement.id)}`);
    if (how === 'keyboard') { await p.keyboard.press('Enter'); await p.waitForTimeout(500); log.push(`reopened: scrollY=${await p.evaluate(() => scrollY)} topbarInert=${await p.evaluate(() => document.querySelector('.topbar').inert)}`); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(200); log.push(`after 2x shift+tab: active=${await p.evaluate(() => document.activeElement.className)} scrollY=${await p.evaluate(() => scrollY)}`); }
    console.log(`mobile=${mobile} ${how}: ` + log.join(' | '));
    await ctx.close();
  }
  await b.close();
})();
