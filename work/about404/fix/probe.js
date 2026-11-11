// node probe.js OUTDIR spec [spec...]   spec = path|width|height|theme|selector-or-y|name[|scale]
// Screenshots one viewport at the element (scrolled to 90px below the top) or at a y offset. Reduced motion, reveals shown.
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2]; const specs = process.argv.slice(3);
  const b = await chromium.launch();
  for (const sp of specs) {
    const [path, w, h, theme, at, name, scale] = sp.split('|');
    const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(scale || 1), colorScheme: theme, reducedMotion: 'reduce', isMobile: +w < 600, hasTouch: +w < 600 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    if (/^\d+$/.test(at)) await p.evaluate(y => scrollTo(0, y), +at);
    else if (at) await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, at);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${name}.png` });
    const info = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, h: document.documentElement.scrollHeight }));
    console.log(name, JSON.stringify(info));
    await ctx.close();
  }
  await b.close();
})();
