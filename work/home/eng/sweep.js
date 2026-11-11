// Fresh-load sweep: overflow, hero collisions, header wrap, clipped text. node sweep.js [from to step]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const from = +(process.argv[2] || 360), to = +(process.argv[3] || 1920), step = +(process.argv[4] || 20);
const H = +(process.argv[5] || 900);
(async () => {
  const b = await chromium.launch();
  const rows = [];
  for (let w = from; w <= to; w += step) {
    const ctx = await b.newContext({ viewport: { width: w, height: H } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(2600);
    const r = await p.evaluate(() => {
      const q = s => document.querySelector(s);
      const R = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY, w: r.width, h: r.height }; };
      const hit = (a, b, pad = 0) => a && b && a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
      const out = {};
      out.over = document.documentElement.scrollWidth - innerWidth;
      out.bodyOver = document.body.scrollWidth - innerWidth;
      // protruding elements (ignoring fixed, sr-only)
      let worst = 0, who = '';
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.closest('.sr-only, .hp, svg, .skip-link')) continue;
        const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
        const d = Math.max(rc.right - innerWidth, -rc.left);
        if (d > worst + .5) { worst = d; who = el.tagName.toLowerCase() + '.' + (el.className.toString ? el.className.toString().trim().replace(/\s+/g, '.') : ''); }
      }
      out.worst = Math.round(worst); out.who = who;
      const phone = R(q('.hero-phone')), cap = R(q('.hero-cap')), scene = R(q('.hero-scene')), copy = R(q('.hero-copy'));
      const btns = [...document.querySelectorAll('.hero .btn-row .btn')].map(R), strip = R(q('.hero .price-strip')), h1 = R(q('h1')), lede = R(q('.hero .lede'));
      const flag = R(q('.hero-cap .flag')), lab = R(q('.hero-cap .phone-label'));
      const sign = R(document.querySelector('.hero-scene svg text, .hero-scene #st-title'));
      const signEl = [...document.querySelectorAll('.hero-scene svg *')].find(e => /YOUR BUSINESS/i.test(e.textContent) && e.children.length === 0);
      const signR = R(signEl);
      out.hero = {
        phoneBtn: btns.some(x => hit(phone, x)), phoneStrip: hit(phone, strip), phoneH1: hit(phone, h1), phoneLede: hit(phone, lede),
        capPhone: hit(cap, phone, 1) || hit(flag, phone, 1) || hit(lab, phone, 1), capScene: hit(flag, scene, 1) || hit(lab, scene, 1),
        phoneSign: hit(phone, signR), artCopy: hit(R(q('.hero-art')), copy, 1),
        phoneTop: phone && Math.round(phone.t), sceneB: scene && Math.round(scene.b), phoneB: phone && Math.round(phone.b), stripB: strip && Math.round(strip.b), btnB: btns[0] && Math.round(btns[0].b), h1B: h1 && Math.round(h1.b), ledeB: lede && Math.round(lede.b),
        signB: signR && Math.round(signR.b), capR: cap && Math.round(cap.r), labW: lab && Math.round(lab.w), labH: lab && Math.round(lab.h), heroArtR: R(q('.hero-art')).r,
        phoneW: phone && Math.round(phone.w), phoneL: phone && Math.round(phone.l), sceneL: scene && Math.round(scene.l), sceneW: scene && Math.round(scene.w)
      };
      const cta = q('.header-cta'); out.ctaH = cta ? Math.round(cta.getBoundingClientRect().height) : null;
      out.ctaShown = cta ? getComputedStyle(cta).display !== 'none' : null;
      const hi = q('.header-inner'); out.headerH = Math.round(q('.site-header').getBoundingClientRect().height);
      // header children overlap
      const kids = [...hi.children].filter(e => getComputedStyle(e).display !== 'none' && getComputedStyle(e).position !== 'fixed' && e.getBoundingClientRect().width).map(e => ({ n: e.className.toString(), r: R(e) }));
      out.hdrOverlap = []; for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (hit(kids[i].r, kids[j].r, 1)) out.hdrOverlap.push(kids[i].n + ' x ' + kids[j].n);
      // clipped text: elements with hidden overflow whose content is larger
      out.clipped = [];
      for (const el of document.querySelectorAll('main *, header *, footer *')) {
        const cs = getComputedStyle(el); if (el.closest('svg, .sr-only')) continue;
        if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && el.textContent.trim() && !el.querySelector('img,svg')) out.clipped.push(el.tagName.toLowerCase() + '.' + el.className.toString().trim().replace(/\s+/g, '.') + ` ${el.scrollWidth}>${el.clientWidth} ${el.scrollHeight}>${el.clientHeight}`);
      }
      out.height = document.documentElement.scrollHeight;
      return out;
    });
    rows.push({ w, ...r });
    await ctx.close();
  }
  await b.close();
  for (const r of rows) {
    const h = r.hero; const flags = [];
    if (r.over > 0 || r.worst > 0) flags.push(`OVERFLOW page+${r.over} el+${r.worst} ${r.who}`);
    for (const k of ['phoneBtn', 'phoneStrip', 'phoneH1', 'phoneLede', 'capPhone', 'capScene', 'phoneSign', 'artCopy']) if (h[k]) flags.push(k);
    if (r.ctaShown && r.ctaH > 46) flags.push('CTA-WRAP h=' + r.ctaH);
    if (r.hdrOverlap.length) flags.push('HDR ' + r.hdrOverlap.join(','));
    if (r.clipped.length) flags.push('CLIP ' + r.clipped.slice(0, 3).join(' | '));
    console.log(`${r.w}: H=${r.height} hdr=${r.headerH} cta=${r.ctaH} phone ${h.phoneL},${h.phoneTop}-${h.phoneB} w${h.phoneW} sceneB=${h.sceneB} signB=${h.signB} strip.b=${h.stripB} btn.b=${h.btnB} lab ${h.labW}x${h.labH} ${flags.length ? '  <<< ' + flags.join('; ') : ''}`);
  }
})();
