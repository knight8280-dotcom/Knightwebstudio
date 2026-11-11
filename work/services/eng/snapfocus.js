const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, theme] of [[390, 844, 'light'], [1440, 900, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
    // keyboard focus on a menu link
    await p.locator('.menu a[href="#care"]').focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    await p.screenshot({ path: `focus-menu-${w}-${theme}.png` });
    await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    await p.locator('#ecommerce summary').focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    await p.screenshot({ path: `focus-summary-${w}-${theme}.png` });
    await p.goto('http://localhost:8720/services/#brand'); await p.waitForTimeout(500); await p.screenshot({ path: `target-brand-${w}-${theme}.png` });
    await ctx.close();
  }
  await b.close();
})();
