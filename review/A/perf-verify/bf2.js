const { chromium } = require('playwright');
(async () => {
  for (const BASE of ['http://localhost:8733']) {
    const b = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-features=BackForwardCache'] });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.addInitScript(() => { window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
    const state = () => page.evaluate(() => ({ url: location.pathname, persisted: window.__persisted, theme: document.documentElement.getAttribute('data-theme'), stored: (() => { try { return localStorage.getItem('theme'); } catch (e) { return 'ERR'; } })(), label: (document.getElementById('theme-toggle') || {}).ariaLabel, themeColor: (document.querySelector('meta[name=theme-color]') || {}).content, bg: getComputedStyle(document.body).backgroundColor }));
    await page.goto(BASE + '/', { waitUntil: 'load' });
    console.log(BASE, 'start   ', JSON.stringify(await state()));
    await page.click('a[href="/pricing/"]:visible').catch(async () => { await page.goto(BASE + '/pricing/'); });
    await page.waitForURL('**/pricing/'); await page.waitForLoadState('load');
    await page.click('#theme-toggle');
    console.log(BASE, 'toggled ', JSON.stringify(await state()));
    await page.goBack({ waitUntil: 'load' }).catch(e => console.log('goBack err', e.message.slice(0, 80)));
    await page.waitForTimeout(600);
    console.log(BASE, 'back    ', JSON.stringify(await state()));
    await page.screenshot({ path: __dirname + '/bf-back-' + BASE.slice(-4) + '.png' });
    await page.reload({ waitUntil: 'load' });
    console.log(BASE, 'reloaded', JSON.stringify(await state()));
    await b.close();
  }
})();
