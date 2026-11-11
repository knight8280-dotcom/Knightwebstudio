// CUST-06: what does the customer see after tapping "Book a Growth Audit, $350" and "Start plan"?
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const [from, label, tag] of [['/consulting/', 'Book a Growth Audit, $350', 'audit'], ['/pricing/', 'Start the Launch bundle', 'bundle'], ['/pricing/', 'Start plan', 'startplan'], ['/pricing/', 'Request plan', 'requestplan']]) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720' + from, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const link = page.locator('main a', { hasText: label }).first();
    await link.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), link.tap()]);
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => {
      const sel = document.querySelector('select[name="package"]');
      const h1 = document.querySelector('h1');
      const lede = document.querySelector('main .lede, main p');
      return { url: location.pathname + location.search, scrollY, h1: h1 && h1.innerText, lede: lede && lede.innerText.replace(/\s+/g, ' ').slice(0, 200),
        pkgY: sel ? Math.round(sel.getBoundingClientRect().top + scrollY) : null, pkgValue: sel ? sel.selectedOptions[0].text : null,
        formY: document.querySelector('form') ? Math.round(document.querySelector('form').getBoundingClientRect().top + scrollY) : null,
        firstScreenText: [...document.querySelectorAll('main h1, main h2, main p, main a.btn, main label, main legend')].filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.width > 0; }).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 90)) };
    });
    console.log(`\n"${label}" on ${from} ->`, JSON.stringify(info, null, 1));
    await page.screenshot({ path: path.join(OUT, `arrive_${tag}.png`) });
    await page.close();
  }
  await browser.close();
})();
