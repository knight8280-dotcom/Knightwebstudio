const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
const ALL = Object.assign({ privacy: { url: '/privacy/' }, terms: { url: '/terms/' } }, S);
(async () => {
  const browser = await chromium.launch();
  for (const name of ['privacy', 'terms', 'co-blocked', 'co-serverdown', 'co-care', 'ok-ach', 'ok-care-paid']) {
    const s = ALL[name];
    const { ctx, page } = await open(browser, s, 'd-light', { rm: 'reduce' });
    await page.goto(base + s.url, { waitUntil: 'load' }); await page.waitForTimeout(900);
    const res = [];
    for (const w of [260, 280, 300, 320, 340, 360]) {
      await page.setViewportSize({ width: w, height: 800 }); await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        let worst = 0, who = '';
        for (const el of document.querySelectorAll('main *')) {
          const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height || el.closest('[hidden], .sr-only')) continue;
          // only count text-bearing leaf boxes
          if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          const d = rc.right - innerWidth; if (d > worst) { worst = d; who = el.tagName.toLowerCase() + '.' + el.className + ' "' + el.textContent.trim().slice(0, 24) + '"'; }
        }
        return worst > 0.5 ? Math.round(worst) + 'px ' + who : 'ok';
      });
      res.push(w + ': ' + r);
    }
    console.log(name, '|', res.join(' | '));
    if (name === 'co-blocked') { await page.setViewportSize({ width: 320, height: 800 }); await page.screenshot({ path: 'shots/co-blocked-320.png' }); await page.setViewportSize({ width: 360, height: 800 }); await page.screenshot({ path: 'shots/co-blocked-360.png' }); }
    await ctx.close();
  }
  await browser.close();
})();
