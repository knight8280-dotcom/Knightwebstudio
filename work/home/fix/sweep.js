// Every 20px from 360 to 1920: hero overlaps, page overflow, and what holds on the first screen.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (let w = 360; w <= 1920; w += 20) {
    const h = w < 440 ? 664 : w < 980 ? 740 : w < 1400 ? 720 : 768;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    // bring the art into view so its reveal has fired, then measure in page coordinates
    await p.evaluate(() => document.querySelector('.hero-art').scrollIntoView({ block: 'center' })); await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const R = s => { const e = typeof s === 'string' ? document.querySelector(s) : s; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top + scrollY, r: b.right, b: b.bottom + scrollY, w: b.width }; };
      const hit = (a, b, pad = 0) => a.w && b.w && a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
      const sign = [...document.querySelectorAll('.hero-scene .sc-sign')].map(e => R(e));
      const parts = { eyebrow: R('.hero .eyebrow'), h1: R('.hero h1'), lede: R('.hero .lede'), b1: R('.hero .btn-row a:nth-child(1)'), b2: R('.hero .btn-row a:nth-child(2)'), strip: R('.hero .price-strip'), points: R('.hero .points') };
      const phone = R('.hero-phone .phone-frame'), flag = R('.hero-cap .flag'), label = R('.hero-cap .phone-label'), scene = R('.hero-scene svg');
      const out = [];
      for (const [k, v] of Object.entries(parts)) { if (hit(phone, v)) out.push('phone x ' + k); if (hit(flag, v) || hit(label, v)) out.push('caption x ' + k); }
      sign.forEach((s, i) => { if (hit(phone, s)) out.push('phone x sign' + i); if (hit(flag, s) || hit(label, s)) out.push('caption x sign' + i); });
      if (hit(flag, phone) || hit(label, phone)) out.push('caption x phone');
      if (hit(flag, scene, 1) || hit(label, scene, 1)) out.push('caption x scene');
      if (label.r > innerWidth - 8 || flag.l < 8) out.push('caption off an edge');
      if (phone.l < 8) out.push('phone off the left edge ' + phone.l);
      const lines = el => { const e = document.querySelector(el); return Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)); };
      return { out, strip: Math.round(parts.strip.b), b1: Math.round(parts.b1.b), b2: Math.round(parts.b2.b), phoneB: Math.round(phone.b), capLines: lines('.hero-cap .phone-label'), ovf: document.documentElement.scrollWidth - innerWidth, vh: innerHeight, cta: (() => { const c = document.querySelector('.header-cta'); const r = c && c.getBoundingClientRect(); return r && r.width ? Math.round(r.height) : 0; })() };
    });
    const first = (r.strip <= r.vh ? '' : ' STRIP BELOW FOLD ' + r.strip) + (r.b1 <= r.vh ? '' : ' PRIMARY BELOW FOLD ' + r.b1);
    if (r.out.length || r.ovf > 0 || first) { bad++; console.log(w + 'x' + h, JSON.stringify(r.out), 'ovf', r.ovf, first); }
    if (w % 100 === 0 || [360, 380, 420, 440, 980, 1040, 1120, 1280].includes(w)) console.log(w + 'x' + h, JSON.stringify({ strip: r.strip, b1: r.b1, phoneB: r.phoneB, capLines: r.capLines, headerCtaH: r.cta }));
    await ctx.close();
  }
  console.log(bad ? bad + ' widths with problems' : 'hero: no overlaps, no overflow, and the price strip is on the first screen at every width 360-1920 (664 tall under 440px wide, 740 tall to 979px, 720 tall to 1399px, 768 tall from 1400px)');
  await b.close();
})();
