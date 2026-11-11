const { chromium } = require('playwright');
const out = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/shots/system/';
(async () => {
  const b = await chromium.launch();
  const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  // no JavaScript: phone and desktop
  for (const [name, w, h, theme] of [['x-nojs-phone', 390, 844, 'light'], ['x-nojs-desktop', 1280, 800, 'light'], ['x-nojs-phone-dark', 390, 844, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, colorScheme: theme }); const p = await ctx.newPage();
    await p.goto('http://localhost:8720/'); await p.waitForTimeout(400);
    await p.screenshot({ path: out + name + '-top.png' });
    await p.evaluate(() => scrollTo(0, 3200)); await p.waitForTimeout(200); await p.screenshot({ path: out + name + '-mid.png' });
    await ctx.close();
  }
  // phone menu open, both themes
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: theme }); await block(ctx); const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/'); await p.click('#nav-toggle'); await p.waitForTimeout(500);
    await p.screenshot({ path: out + `x-menu-${theme}.png` }); await ctx.close();
  }
  // focus rings: a button, a link on blue, a form field
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' }); await block(ctx); const p = await ctx.newPage();
    await p.goto('http://localhost:8721/#buttons'); await p.waitForTimeout(300);
    await p.focus('[data-comp="buttons"] .btn-primary'); await p.keyboard.press('Tab'); await p.waitForTimeout(100);
    await p.locator('[data-comp="buttons"]').screenshot({ path: out + 'x-focus-button.png' });
    await p.focus('[data-comp="tones"] .on-blue .btn'); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(100);
    await p.locator('[data-comp="tones"]').screenshot({ path: out + 'x-focus-onblue.png' });
    await p.focus('#g-company'); await p.waitForTimeout(100);
    await p.locator('[data-comp="forms"]').screenshot({ path: out + 'x-focus-field.png' });
    await p.focus('[data-comp="faq"] summary'); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(100);
    await p.locator('[data-comp="faq"]').screenshot({ path: out + 'x-focus-faq.png' });
    await ctx.close(); }
  await b.close();
})();
