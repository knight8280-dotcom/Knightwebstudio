const { chromium, open } = require('./lib.js');
(async () => {
  const browser = await chromium.launch();
  for (const rm of ['reduce', 'no-preference']) {
    const { ctx, page } = await open(browser, { url: '/privacy/' }, 'd-dark', { rm });
    await page.goto('http://localhost:8720/privacy/', { waitUntil: 'load' }); await page.waitForTimeout(700);
    await page.evaluate(() => { const m = document.getElementById('main'); m.setAttribute('tabindex', '-1'); m.focus(); m.removeAttribute('tabindex'); });
    const rows = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(rm === 'reduce' ? 50 : 700);
      rows.push(await page.evaluate(() => { const el = document.activeElement; const r = el.getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect(); return el.textContent.trim().slice(0, 14) + ' top ' + Math.round(r.top) + ' bottom ' + Math.round(r.bottom) + ' (vh ' + innerHeight + ', header bottom ' + Math.round(h.bottom) + ', scrollY ' + Math.round(scrollY) + ')'; }));
    }
    console.log(rm + '\n  ' + rows.slice(8).join('\n  '));
    if (rm === 'reduce') { await page.screenshot({ path: 'shots/privacy-focus-dark.png' }); }
    await ctx.close();
  }
  await browser.close();
})();
