const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 340, 360, 370, 375, 379, 380, 382, 384, 390, 412, 430, 599, 600, 760, 980, 1024, 1279, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 700, hasTouch: w < 700 }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/?package=gbp', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const s = document.getElementById('package'); const cs = getComputedStyle(s); const avail = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); const c = document.createElement('canvas').getContext('2d'); c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const ws = [...s.options].map(o => [o.text, Math.round(c.measureText(o.text).width)]); const max = Math.max(...ws.map(x => x[1])); const em = document.getElementById('email'); const ecs = getComputedStyle(em); return { fs: cs.fontSize, avail: Math.round(avail), max, spare: Math.round(avail - max), cut: ws.filter(x => x[1] > avail).map(x => x[0]), emailRoom: Math.round(em.clientWidth - parseFloat(ecs.paddingLeft) - parseFloat(ecs.paddingRight)), sw: document.documentElement.scrollWidth }; });
    console.log(w, JSON.stringify(r));
    if ([360, 375, 380, 390].includes(w)) await p.locator('#package').screenshot({ path: `${__dirname}/select-gbp-${w}.png` });
    if (w === 360) { await p.selectOption('#package', 'followup'); await p.locator('#package').screenshot({ path: `${__dirname}/select-followup-${w}.png` }); }
    await ctx.close();
  }
  await b.close();
})();
