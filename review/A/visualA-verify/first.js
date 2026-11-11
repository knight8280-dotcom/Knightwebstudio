const { open, done, close } = require('./lib');
const path = require('path');
(async () => {
  for (const theme of ['light', 'dark']) for (const p of ['/', '/start/', '/pricing/', '/consulting/', '/services/']) {
    const page = await open(p, 390, { theme, h: 664, revealAll: false });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(__dirname, `first_${(p.replace(/\//g, '') || 'home')}_${theme}.png`) });
    await done(page);
  }
  await close();
})();
