const { launch, ctx, URL, PORT } = require('./common');
(async () => {
  const b = await launch();
  for (const scheme of ['dark', 'light']) {
    const c = await ctx(b, { viewport: { width: 390, height: 844 }, forcedColors: 'active', colorScheme: scheme }); const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1800);
    await p.screenshot({ path: 'forced-' + scheme + '-top.png' });
    await p.evaluate(() => document.querySelector('#services .kws-marks').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(900); await p.screenshot({ path: 'forced-' + scheme + '-cards.png' });
    await p.evaluate(() => document.querySelector('#pricing .kws-folders').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(600); await p.screenshot({ path: 'forced-' + scheme + '-stack.png' });
    await p.evaluate(() => document.querySelector('.cta-band').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(1200); await p.screenshot({ path: 'forced-' + scheme + '-band.png' });
    console.log(scheme, await p.evaluate(() => ({ fc: matchMedia('(forced-colors: active)').matches, live: document.querySelectorAll('.kws-shader.is-live').length, h1: getComputedStyle(document.querySelector('h1')).color, bodybg: getComputedStyle(document.body).backgroundColor, selTab: getComputedStyle(document.querySelector('[role=tab][aria-selected=true]')).backgroundColor + ' / ' + getComputedStyle(document.querySelector('[role=tab][aria-selected=true]')).boxShadow, unselTab: getComputedStyle(document.querySelector('[role=tab][aria-selected=false]')).backgroundColor })));
    await c.close();
  }
  await b.close();
})();
