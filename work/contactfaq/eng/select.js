const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 412, 430]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/?package=gbp', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const s = document.getElementById('package'); const cs = getComputedStyle(s); const avail = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); const c = document.createElement('canvas').getContext('2d'); c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return { avail: Math.round(avail), cut: [...s.options].map(o => [o.text, Math.round(c.measureText(o.text).width)]).filter(x => x[1] > avail) }; });
    console.log(w, 'available', r.avail, 'options cut:', JSON.stringify(r.cut));
    if (w === 360 || w === 390) await p.locator('#package').screenshot({ path: `${__dirname}/misc/select-gbp-${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
