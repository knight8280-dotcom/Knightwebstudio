const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const PAGES = ['/work/','/process/','/contact/','/faq/','/about/','/404.html','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/'];
(async () => {
  const browser = await chromium.launch();
  const mk = async (w, h) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' }); await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); return ctx; };
  // 1. city eyebrow wrap range
  console.log('== city eyebrow lines by width');
  for (const c of ['baton-rouge','denham-springs','gonzales','prairieville']) {
    const ctx = await mk(360, 800); const page = await ctx.newPage(); await page.goto(BASE + '/web-design-' + c + '/'); const wraps = [];
    for (let w = 320; w <= 440; w += 2) { await page.setViewportSize({ width: w, height: 800 }); const h = await page.evaluate(() => { const e = document.querySelector('.page-head .eyebrow'); return [e.getBoundingClientRect().height, parseFloat(getComputedStyle(e).lineHeight)]; }); if (h[0] > h[1] * 1.5) wraps.push(w); }
    console.log(c, 'wraps at', wraps.length ? wraps[0] + '..' + wraps[wraps.length - 1] : 'never');
    await ctx.close();
  }
  // 2. component consistency
  for (const w of [390, 1440]) {
    console.log('== consistency at', w);
    const ctx = await mk(w, 900);
    for (const p of PAGES) {
      const page = await ctx.newPage(); await page.goto(BASE + p); await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const g = (sel, props) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); const o = {}; for (const pr of props) o[pr] = cs[pr]; const b = el.getBoundingClientRect(); o.h = Math.round(b.height); o.top = Math.round(b.top + scrollY); o.left = Math.round(b.left); return o; };
        const fmt = o => o ? Object.entries(o).map(([k, v]) => k.replace(/[a-z]+([A-Z])/g, (m) => m) + ':' + v).join(' ') : '-';
        return {
          head: fmt(g('.page-head', ['paddingTop', 'paddingBottom'])),
          eyebrow: fmt(g('.page-head .eyebrow', ['fontSize', 'letterSpacing', 'marginBottom'])),
          h1: fmt(g('h1', ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'marginBottom'])),
          lede: fmt(g('.page-head .lede', ['fontSize', 'lineHeight', 'maxWidth', 'marginTop'])),
          btn: fmt(g('main .btn-primary', ['fontSize', 'borderRadius', 'paddingLeft', 'fontWeight'])),
          h2: fmt(g('main .section h2:not(.label):not(.eyebrow):not(.h3):not(.h4):not(.title)', ['fontSize', 'lineHeight', 'fontWeight'])),
          first: fmt(g('.section-first', ['paddingTop', 'paddingBottom'])),
          cta: fmt(g('.cta-band', ['paddingTop', 'paddingBottom'])),
          ctah2: fmt(g('.cta-band h2', ['fontSize'])),
          card: fmt(g('main .card, main .ticket, main .receipt', ['borderRadius', 'boxShadow'])),
        };
      });
      console.log(p); for (const [k, v] of Object.entries(r)) console.log('   ', k.padEnd(8), v);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
