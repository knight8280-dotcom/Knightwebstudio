// Every 20px from 360 to 1920: does anything in the hero overlap anything it should not? Also first-screen checks.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (let w = 360; w <= 1920; w += 20) {
    const h = w < 700 ? 844 : 800;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'load' });
    await p.waitForTimeout(2300);
    const r = await p.evaluate(() => {
      const R = s => { const e = typeof s === 'string' ? document.querySelector(s) : s; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top + scrollY, r: b.right, b: b.bottom + scrollY }; };
      const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
      const sign = [...document.querySelectorAll('.hero-scene .sc-sign')].map(e => R(e));
      const parts = { h1: R('.hero h1'), lede: R('.hero .lede'), b1: R('.hero .btn-row a:nth-child(1)'), b2: R('.hero .btn-row a:nth-child(2)'), strip: R('.hero .price-strip'), points: R('.hero .points'), eyebrow: R('.hero .eyebrow') };
      const phone = R('.hero-phone .phone-frame'), cap = R('.hero-cap'), flag = R('.hero-cap .flag'), label = R('.hero-cap .phone-label'), scene = R('.hero-scene svg');
      const out = [];
      for (const [k, v] of Object.entries(parts)) { if (hit(phone, v)) out.push('phone x ' + k); if (hit(flag, v) || hit(label, v)) out.push('caption x ' + k); }
      sign.forEach((s, i) => { if (hit(phone, s)) out.push('phone x sign' + i); if (hit(flag, s) || hit(label, s)) out.push('caption x sign' + i); });
      if (hit(flag, phone) || hit(label, phone)) out.push('caption x phone');
      if (hit(flag, scene, 1) || hit(label, scene, 1)) out.push('caption x scene');
      if (label.r > innerWidth - 8) out.push('caption off the right edge');
      if (phone.l < 8) out.push('phone off the left edge ' + phone.l);
      return { out, stripBottom: Math.round(parts.strip.b), b1Bottom: Math.round(parts.b1.b), b2Bottom: Math.round(parts.b2.b), phoneTop: Math.round(phone.t), signBottom: sign.length ? Math.round(Math.max(...sign.slice(0, 1).map(s => s.b))) : null, labelW: Math.round(label.r - label.l), ovf: document.documentElement.scrollWidth - innerWidth, vh: innerHeight };
    });
    const first = w >= 980 ? (r.stripBottom <= r.vh ? '' : ' STRIP BELOW FOLD ' + r.stripBottom) : (r.b1Bottom <= r.vh ? '' : ' PRIMARY BELOW FOLD ' + r.b1Bottom);
    if (r.out.length || r.ovf > 0 || first) { bad++; console.log(w, JSON.stringify(r.out), 'ovf', r.ovf, first); }
    if ([360, 390, 430, 980, 1000, 1040, 1100, 1280, 1440, 1920].includes(w)) console.log(w, 'ok-detail', JSON.stringify({ strip: r.stripBottom, b1: r.b1Bottom, b2: r.b2Bottom, phoneTop: r.phoneTop, signBottom: r.signBottom, vh: r.vh }));
    await ctx.close();
  }
  console.log(bad ? bad + ' widths with problems' : 'hero: no overlaps, no overflow, first screen holds at every width 360-1920');
  await b.close();
})();
