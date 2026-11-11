const { chromium } = require('playwright');
const FIX = {
  reviewer: '.topbar-tel:focus-visible { outline-offset: calc(-1 * var(--focus-w)); }',
  padded: '.topbar-tel { padding-inline: var(--s-2); margin-inline: calc(-1 * var(--s-2)); } .topbar-tel:focus-visible { outline-offset: calc(-1 * var(--focus-w)); }',
};
(async () => {
  const b = await chromium.launch();
  for (const [name, css] of Object.entries(FIX)) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 700 }, colorScheme: 'light', deviceScaleFactor: 3 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.addStyleTag({ content: css });
    await p.keyboard.press('Tab');
    for (let i = 0; i < 4; i++) { if (/topbar-tel/.test(await p.evaluate(() => document.activeElement.className))) break; await p.keyboard.press('Tab'); }
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { l: r.left, r: r.right, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    console.log(name, w, JSON.stringify(r));
    await p.screenshot({ path: `shots/v07fix_${name}_${w}.png`, clip: { x: Math.max(0, r.l - 14), y: 0, width: Math.min(w - Math.max(0, r.l - 14), r.r - r.l + 28), height: 70 } });
    await ctx.close();
  }
  await b.close();
})();
