// node region.js OUTDIR "sel@width[@theme]" ...   screenshots one element (with some room around it) at a width
const { chromium } = require('playwright');
const out = process.argv[2]; require('fs').mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const spec of process.argv.slice(3)) {
    const [sel, w, theme = 'light', name] = spec.split('@');
    const width = +w, mobile = width < 700;
    const ctx = await b.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, colorScheme: theme, deviceScaleFactor: mobile ? 2 : 1 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.evaluate(() => document.fonts.ready);
    // scroll through the page so every reveal has fired
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(60); }
    await p.waitForTimeout(700);
    const box = await p.evaluate(sel => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }, sel);
    await p.evaluate(() => { for (const s of ['.mobile-cta', '.site-header', '.topbar']) { const e = document.querySelector(s); if (e) e.style.visibility = 'hidden'; } });
    await p.waitForTimeout(500);
    const pad = 16;
    await p.screenshot({ path: `${out}/${name || sel.replace(/[^a-z0-9]+/gi, '_')}_${width}_${theme}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, box.y - pad), width, height: Math.min(box.h + pad * 2, 2400) } });
    console.log(spec, Math.round(box.w) + 'x' + Math.round(box.h));
    await ctx.close();
  }
  await b.close();
})();
