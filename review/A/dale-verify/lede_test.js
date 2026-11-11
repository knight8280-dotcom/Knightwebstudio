// CUST-04 / CUST-05 / CUST-01: does a longer lede push the button or the price strip off the first screen?
// Nothing is written to the site: the sentence is added in the page, in the browser only.
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
const cases = [
  { path: '/', sel: '.hero .lede, main .lede', add: ' One local person in Baton Rouge. Fixed prices, and you own everything.', name: 'home' },
  { path: '/start/', sel: 'main .lede', replace: 'Websites live in as little as 7–10 days, plus missed-call text-back, online booking and Google reviews. Fixed prices, and you own everything.', name: 'start' },
  { path: '/consulting/', sel: 'main .lede', replace: 'A website is one piece. We also set up the systems behind it: Google reviews, missed-call text-back, online booking and automatic follow-up. Fixed prices. The first check is free; a Growth Audit is a 60-minute session and a written action plan, $350.', name: 'consulting' },
];
const views = [[360, 740], [390, 844], [1280, 800], [1366, 768], [1440, 900]];
(async () => {
  const browser = await chromium.launch();
  for (const c of cases) for (const [w, h] of views) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: w < 800, hasTouch: w < 800 });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720' + c.path, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const m = () => page.evaluate(sel => {
      const lede = document.querySelector(sel);
      const head = lede.closest('section, header');
      const btn = head.querySelector('.btn');
      const strip = head.querySelector('.price-strip');
      const b = el => el ? Math.round(el.getBoundingClientRect().bottom + scrollY) : null;
      return { ledeText: lede.innerText.replace(/\s+/g, ' ').slice(0, 60), ledeLines: Math.round(lede.getBoundingClientRect().height / parseFloat(getComputedStyle(lede).lineHeight)), ledeBottom: b(lede), firstBtnBottom: b(btn), stripBottom: b(strip), overflowX: document.documentElement.scrollWidth - innerWidth };
    }, c.sel);
    const before = await m();
    await page.evaluate(({ sel, add, replace }) => {
      const lede = document.querySelector(sel);
      if (replace) lede.textContent = replace; else lede.appendChild(document.createTextNode(add));
    }, c);
    await page.waitForTimeout(200);
    const after = await m();
    console.log(`${c.name} ${w}x${h}: lede lines ${before.ledeLines}->${after.ledeLines}; first button bottom ${before.firstBtnBottom}->${after.firstBtnBottom}; price strip bottom ${before.stripBottom}->${after.stripBottom} (fold ${h}) ${after.stripBottom > h && before.stripBottom <= h ? '** STRIP PUSHED BELOW FOLD **' : ''}${after.firstBtnBottom > h && before.firstBtnBottom <= h ? '** BUTTON PUSHED BELOW FOLD **' : ''} overflowX ${after.overflowX}`);
    if ((w === 390 || w === 1280)) await page.screenshot({ path: path.join(OUT, `ledetest_${c.name}_${w}.png`) });
    await ctx.close();
  }
  await browser.close();
})();
