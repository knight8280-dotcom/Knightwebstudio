const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const theme of ['light', 'dark']) { const ctx = await ctxFor(b, { w: 390, h: 844, theme, reduced: true, mobile: true }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
    await p.focus('#nav-toggle'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    for (let i = 0; i < 4; i++) await p.keyboard.press('Tab'); await p.waitForTimeout(150); await p.screenshot({ path: `shots/menu_focus_${theme}_a.png` });
    for (let i = 0; i < 4; i++) await p.keyboard.press('Tab'); await p.waitForTimeout(150); await p.screenshot({ path: `shots/menu_focus_${theme}_b.png` });
    for (let i = 0; i < 3; i++) await p.keyboard.press('Tab'); await p.waitForTimeout(150); await p.screenshot({ path: `shots/menu_focus_${theme}_c.png` });
    console.log(theme, await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return e.id + ' ' + cs.outlineColor + ' ' + cs.outlineWidth; }));
    await ctx.close(); }
  await b.close(); })();
