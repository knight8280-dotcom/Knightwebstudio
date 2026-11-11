const { chromium, open, S } = require('./lib.js');
(async () => { const browser = await chromium.launch();
  for (const name of ['co-care', 'ok-care-paid', 'ok-longlabel']) { const { ctx, page } = await open(browser, S[name], 'd-light', { rm: 'reduce' });
    await page.goto('http://localhost:8720' + S[name].url); await page.waitForTimeout(900); await page.evaluate(() => document.fonts.ready);
    let min = 1e9, at = 0; const neg = [];
    for (let w = 360; w <= 1920; w += 10) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(30);
      const s = await page.evaluate(() => { const b = document.querySelector('.receipt-total b'); const p = b.parentElement; return Math.round(p.getBoundingClientRect().width - b.getBoundingClientRect().width); });
      if (s < min) { min = s; at = w; } if (s < 0) neg.push(w + ':' + s); }
    const txt = await page.evaluate(() => document.querySelector('.receipt-total').textContent);
    console.log(name, JSON.stringify(txt), 'least slack', min + 'px at', at + 'px', neg.length ? '| overflows at ' + neg[0] + ' … ' + neg[neg.length - 1] : '');
    await ctx.close(); }
  await browser.close(); })();
