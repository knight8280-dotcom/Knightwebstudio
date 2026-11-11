// Measures the fieldset legends on /contact/ and /consulting/ in a WebKit build, over time, with optional CSS fix injected.
const { webkit } = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
const fix = process.env.FIX || ''; const shots = process.env.SHOTS || '';
(async () => {
  const b = await webkit.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 820, height: 1100 }, { width: 1280, height: 800 }]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 900 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const path of ['/contact/', '/consulting/']) {
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'domcontentloaded' });
      if (fix) await p.addStyleTag({ content: fix });
      const m = () => p.evaluate(() => [...document.querySelectorAll('fieldset > legend')].map(l => { const r = l.getBoundingClientRect(), f = l.parentElement.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) + ' in ' + Math.round(f.width) + 'x' + Math.round(f.height); }).join(' | '));
      const t0 = await m(); await p.waitForLoadState('load'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600); const t1 = await m();
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1200); const t2 = await m();
      if (shots) await p.screenshot({ path: `${shots}_${vp.width}_${path.replace(/\//g, '')}.png` });
      console.log(`${vp.width} ${path}\n   at DOM ready: ${t0}\n   after load:   ${t1}\n   after scroll: ${t2}`);
      await p.close();
    }
    await ctx.close();
  }
  await b.close();
})();
