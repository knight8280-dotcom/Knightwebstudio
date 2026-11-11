// First-screen metrics and screenshots at the acceptance sizes
const { chromium } = require('playwright');
const out = process.argv[2] || 'r1';
require('fs').mkdirSync(out, { recursive: true });
const sizes = [[390,664],[375,553],[390,844],[360,740],[360,640],[430,740],[820,1100],[1280,800],[1366,768],[1280,720],[1440,900],[1024,768],[980,800]];
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of sizes) {
    const mobile = w < 700;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    const m = await p.evaluate(() => {
      const r = s => { const e = document.querySelector(s); if (!e) return null; const c = e.getBoundingClientRect(); return c.width ? [Math.round(c.top), Math.round(c.bottom)] : null; };
      const lede = document.querySelector('.hero .lede'); const lh = parseFloat(getComputedStyle(lede).lineHeight);
      return { eyebrow: r('.hero .eyebrow'), h1: r('.hero h1'), lede: r('.hero .lede'), ledeLines: Math.round(lede.getBoundingClientRect().height / lh), primary: r('.hero .btn-primary'), secondary: r('.hero .btn-row .btn:not(.btn-primary)'), strip: r('.hero .price-strip'), art: r('.hero-art'), phone: r('.hero-phone'), headerCta: r('.header-cta'), pageH: document.documentElement.scrollHeight };
    });
    console.log(`${w}x${h}`, JSON.stringify(m), m.strip && m.strip[1] <= h ? 'strip IN' : 'strip OUT', m.primary[1] <= h ? 'btn IN' : 'btn OUT');
    await p.screenshot({ path: `${out}/first_${w}x${h}.png` });
    await ctx.close();
  }
  await b.close();
})();
