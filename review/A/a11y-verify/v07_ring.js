// A11Y-07: is the focus ring on the top-strip phone link drawn all the way round?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 700 }, colorScheme: scheme, deviceScaleFactor: 3 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.keyboard.press('Tab'); // skip link
    let name = '';
    for (let i = 0; i < 4; i++) { name = await p.evaluate(() => document.activeElement.className); if (/topbar-tel/.test(name)) break; await p.keyboard.press('Tab'); }
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const el = document.activeElement; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const tb = document.querySelector('.topbar').getBoundingClientRect(); const hd = document.getElementById('site-header'); return { cls: el.className, rect: [r.left, r.top, r.right, r.bottom].map(Math.round), outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor, offset: cs.outlineOffset, topbar: [tb.top, tb.bottom].map(Math.round), topbarBg: getComputedStyle(document.querySelector('.topbar')).backgroundColor, topbarOverflow: getComputedStyle(document.querySelector('.topbar')).overflow, headerTop: Math.round(hd.getBoundingClientRect().top), headerZ: getComputedStyle(hd).zIndex, topbarZ: getComputedStyle(document.querySelector('.topbar')).zIndex, pageBg: getComputedStyle(document.body).backgroundColor }; });
    console.log(scheme, w, JSON.stringify(m));
    const x0 = Math.max(0, m.rect[0] - 14), cw = Math.min(w - x0, m.rect[2] - m.rect[0] + 28);
    await p.screenshot({ path: `shots/v07_${scheme}_${w}.png`, clip: { x: x0, y: 0, width: cw, height: 70 } });
    await ctx.close();
  }
  await b.close();
})();
