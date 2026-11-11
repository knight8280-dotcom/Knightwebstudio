const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const HDR = `@media (min-width: 1100px) { .site-header .header-cta { white-space: nowrap; } .nav-links a { padding-inline: var(--s-2); } .nav-links a::after { inset-inline: var(--s-2); } }`;
const HDR_WRAP = HDR + ` .header-inner { flex-wrap: wrap; row-gap: var(--s-1); }`;
const SPACING = '*{letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.5!important}';
const STRIP = `.price-strip { width: fit-content; max-width: 100%; } .price-strip-nums { flex-wrap: wrap; row-gap: var(--s-1); } .price-strip-nums b:last-child { padding-right: 0; } @media (max-width: 599.98px) { .price-strip-nums b { padding: 0 var(--s-2); } }`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const hdr = async (label, css, path = '/pricing/') => { const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); if (css) await p.addStyleTag({ content: css }); await p.evaluate(() => document.fonts.ready); const rows = []; let worst = 0, two = [];
    for (let w = 1100; w <= 1400; w += 10) { await p.setViewportSize({ width: w, height: 800 }); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(30);
      for (const sc of [0, 600]) { await p.evaluate(v => scrollTo(0, v), sc); await p.waitForTimeout(sc ? 350 : 20); const r = await p.evaluate(() => { const cta = document.querySelector('.site-header .header-cta').getBoundingClientRect(); const inner = document.querySelector('.header-inner'); const ir = inner.getBoundingClientRect(); const cs = getComputedStyle(inner); const right = ir.right - parseFloat(cs.paddingRight || 0); return { h: Math.round(cta.height), over: Math.round(cta.right - right), headerH: Math.round(ir.height), docOver: document.documentElement.scrollWidth - innerWidth }; }); if (r.h > 44) two.push(w + (sc ? 's' : '')); worst = Math.max(worst, r.over, r.docOver); if (r.headerH > 72) rows.push(w + (sc ? 's' : '') + ':hdr' + r.headerH); } }
    console.log(label, path, '| two-line button at:', two.join(',') || 'never', '| worst overflow px:', worst, '| header taller than 72 at:', rows.join(',') || 'never'); await p.close(); };
  await hdr('NOW          ', '');
  await hdr('FIX          ', HDR);
  await hdr('FIX          ', HDR, '/');
  await hdr('NOW + spacing', SPACING);
  await hdr('FIX + spacing', HDR + SPACING);
  await hdr('FIX+wrap+spc ', HDR_WRAP + SPACING);
  await hdr('FIX+wrap     ', HDR_WRAP);
  await hdr('FIX+wrap 125%', HDR_WRAP + 'html{font-size:125%}');
  // underline of the current menu item still lines up after the padding change
  { const p = await ctx.newPage(); await p.setViewportSize({ width: 1280, height: 800 }); await p.goto(base + '/pricing/'); await p.addStyleTag({ content: HDR }); await p.waitForTimeout(200);
    console.log('current item underline vs its text (left,right deltas):', JSON.stringify(await p.evaluate(() => { const a = document.querySelector('.nav-links [aria-current]'); const r = a.getBoundingClientRect(); const cs = getComputedStyle(a, '::after'); return { padL: getComputedStyle(a).paddingLeft, afterLeft: cs.left, afterRight: cs.right, w: Math.round(r.width) }; }))); await p.close(); }

  // price strip
  for (const css of ['', STRIP, STRIP + SPACING, SPACING]) { const out = [];
    for (const path of ['/', '/web-design-baton-rouge/', '/start/', '/consulting/']) for (const w of [360, 379, 380, 390, 393, 430, 600, 1280]) { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 844 }); await p.goto(base + path, { waitUntil: 'load' }); if (css) await p.addStyleTag({ content: css }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(80);
      const r = await p.evaluate(() => { const s = document.querySelector('.price-strip'); const n = s.querySelector('.price-strip-nums'); const c = s.parentElement.getBoundingClientRect(); const nr = n.getBoundingClientRect(); const bs = [...n.querySelectorAll('b')]; const rows = new Set(bs.map(x => Math.round(x.getBoundingClientRect().top))).size; return { over: Math.round(Math.max(...bs.map(x => x.getBoundingClientRect().right)) - c.right), rows, linkW: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height) }; });
      if (r.over > 0 || r.rows > 1 || w === 390 || w === 1280) out.push(path + '@' + w + ' over' + r.over + ' rows' + r.rows + ' linkW' + r.linkW + ' h' + r.h); await p.close(); }
    console.log('\nprice strip', css === '' ? 'NOW' : css === STRIP ? 'FIX' : css === SPACING ? 'NOW + WCAG spacing' : 'FIX + WCAG spacing', '\n  ' + out.join('\n  ')); }

  // hover lift with translate; active after hover
  { const p = await ctx.newPage(); await p.setViewportSize({ width: 1440, height: 900 }); await p.goto(base + '/start/'); await p.addStyleTag({ content: `@media (hover: hover) { .print:hover { translate: 0 calc(-1 * var(--s-1)); } .btn:hover:active { transform: translateY(var(--hair)); } } .print { transition: var(--move), translate var(--t) var(--ease); }` }); await p.waitForTimeout(300);
    const loc = p.locator('a.print').first(); await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await loc.hover(); await p.waitForTimeout(400); console.log('\nprint hover with translate:', await loc.evaluate(e => getComputedStyle(e).translate));
    const btn = p.locator('.page-head .btn-primary').first(); await btn.scrollIntoViewIfNeeded(); const bx = await btn.boundingBox(); await p.mouse.move(bx.x + 10, bx.y + 10); await p.waitForTimeout(300); await p.mouse.down(); await p.waitForTimeout(300); console.log('btn :hover:active transform:', await btn.evaluate(e => getComputedStyle(e).transform)); await p.mouse.up(); await p.close(); }
  await b.close();
})();
