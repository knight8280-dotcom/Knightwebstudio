const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [path, w] of [['/contact/', 390], ['/faq/', 390], ['/contact/', 1280], ['/faq/', 1280]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, javaScriptEnabled: false, isMobile: w < 700 });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const name = `shots/nojs-${path.replace(/\//g, '')}-${w}.png`;
    await p.screenshot({ path: name, fullPage: true });
    // javaScriptEnabled:false also blocks evaluate, so read computed facts through locators
    const hiddenBooking = await p.locator('.booking-only').first().isHidden().catch(() => 'n/a');
    const details = await p.locator('details').count();
    const openDetails = await p.locator('details[open]').count();
    console.log(path, w, 'booking hidden:', hiddenBooking, 'details:', details, 'open:', openDetails, name);
    if (path === '/faq/' && w === 390) {
      // open a closed question by click with scripts off
      const s = p.locator('details:not([open]) summary').first();
      await s.click();
      console.log('  after click open count:', await p.locator('details[open]').count());
    }
    await ctx.close();
  }
  await b.close();
})();
