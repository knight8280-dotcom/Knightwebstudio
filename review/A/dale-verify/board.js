// CUST-02: what does the home price board look like on a phone, what tells you a row is a link, and where does a tap go?
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
(async () => {
  const browser = await chromium.launch();
  for (const [base, tag, sel] of [['http://localhost:8720', 'new', 'a.tier'], ['http://localhost:8700', 'old', 'a.mini-price']]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const info = await page.evaluate(sel => [...document.querySelectorAll(sel)].map(a => {
      const cs = getComputedStyle(a), af = getComputedStyle(a, '::after'), bf = getComputedStyle(a, '::before');
      const r = a.getBoundingClientRect();
      return { href: a.getAttribute('href'), y: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width),
        deco: cs.textDecorationLine, border: cs.borderTopWidth + '/' + cs.borderBottomWidth, bg: cs.backgroundColor, radius: cs.borderRadius, shadow: cs.boxShadow.slice(0, 40),
        after: af.content, before: bf.content, svg: a.querySelectorAll('svg').length, text: a.innerText.replace(/\s+/g, ' ').slice(0, 60) };
    }), sel);
    console.log(tag, JSON.stringify(info, null, 1));
    const first = page.locator(sel).first();
    await first.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `board_${tag}_390.png`) });
    // tap the Starter row
    const starter = page.locator(sel, { hasText: 'Starter' }).first();
    await starter.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), starter.tap()]);
    await page.waitForTimeout(700);
    console.log(tag, 'after tapping Starter ->', page.url(), '| h1:', await page.locator('h1').first().innerText());
    await page.screenshot({ path: path.join(OUT, `board_${tag}_after_tap.png`) });
    await ctx.close();
  }
  await browser.close();
})();
