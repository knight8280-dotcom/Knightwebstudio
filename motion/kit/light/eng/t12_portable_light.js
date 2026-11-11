const { launch, ctx, PORT } = require('./common');
(async () => {
  const b = await launch();
  const c = await ctx(b, { viewport: { width: 390, height: 844 }, colorScheme: 'light' }); const p = await c.newPage();
  await p.goto(PORT, { waitUntil: 'load' }); await p.waitForTimeout(800);
  console.log('portable with colorScheme light and no saved choice → data-theme:', await p.evaluate(() => document.documentElement.getAttribute('data-theme')), 'body bg', await p.evaluate(() => getComputedStyle(document.body).backgroundColor));
  await p.click('#theme'); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const a = document.querySelector('.block .btn'); const cs = getComputedStyle(a); a.scrollIntoView({ block: 'center', behavior: 'instant' }); return { theme: document.documentElement.getAttribute('data-theme'), color: cs.color, bg: cs.backgroundColor }; });
  console.log('after Switch theme:', JSON.stringify(r));
  await p.waitForTimeout(900); await p.locator('.block').screenshot({ path: 'portable-light-block.png' });
  await b.close();
})();
