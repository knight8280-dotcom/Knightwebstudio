const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const vp of [{ w: 390, h: 844, mobile: true }, { w: 1440, h: 900 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, reducedMotion: 'reduce', colorScheme: theme, hasTouch: !!vp.mobile, isMobile: !!vp.mobile });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
    const seen = []; const problems = []; let n = 0;
    for (let i = 0; i < 160; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(vp.mobile ? 160 : 60);
      const info = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        const hdr = document.querySelector('.site-header').getBoundingClientRect();
        const bar = document.getElementById('mobile-cta'); const barShown = bar && bar.classList.contains('show') && getComputedStyle(bar).visibility !== 'hidden' && getComputedStyle(bar).display !== 'none' && bar.getBoundingClientRect().height > 0; const br = bar ? bar.getBoundingClientRect() : null;
        // ring: outline on the element or on a focus-within ancestor
        let ring = { w: parseFloat(cs.outlineWidth) || 0, style: cs.outlineStyle, color: cs.outlineColor, off: cs.outlineOffset, on: 'self', shadow: cs.boxShadow };
        if (ring.style === 'none' || ring.w === 0) { let a = el.parentElement; while (a && a !== document.body) { const s = getComputedStyle(a); if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) { ring = { w: parseFloat(s.outlineWidth), style: s.outlineStyle, color: s.outlineColor, off: s.outlineOffset, on: a.className }; break; } a = a.parentElement; } }
        // background behind the ring: nearest opaque ancestor background of the element's parent
        let bg = null; for (let e = el.parentElement; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const m = c.match(/rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); if (v.length < 4 || v[3] === 1) { bg = c; break; } } }
        const inHeader = !!el.closest('.site-header, .topbar, .skip-link'); const inBar = !!el.closest('#mobile-cta');
        const obscuredTop = !inHeader && !inBar && r.top < hdr.bottom - 1 && r.bottom > hdr.top; const obscuredBottom = !inBar && barShown && r.bottom > br.top + 1;
        const fullyHidden = (!inHeader && !inBar && r.bottom <= hdr.bottom) || (!inBar && barShown && r.top >= br.top) || r.bottom < 0 || r.top > innerHeight;
        if (!el.dataset.fw) el.dataset.fw = String((window.__fw = (window.__fw || 0) + 1)); else return 'LOOP'; return { tag: el.tagName.toLowerCase(), id: el.id, cls: (el.className || '').toString().split(' ')[0], text: (el.textContent || el.value || '').trim().slice(0, 34), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), ring, bg, obscuredTop, obscuredBottom, fullyHidden, vis: cs.visibility, inBar, inHeader };
      });
      if (!info) continue; if (info === 'LOOP') break; n++;
      const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      let ratio = null; const rc = parse(info.ring.color || ''), bc = parse(info.bg || ''); if (rc && bc) ratio = (Math.max(lum(rc), lum(bc)) + .05) / (Math.min(lum(rc), lum(bc)) + .05);
      const line = `${String(i + 1).padStart(3)} ${info.tag}${info.id ? '#' + info.id : ''}.${info.cls} "${info.text}" y=${info.top}..${info.bottom} ring=${info.ring.w}px ${info.ring.style} ${info.ring.color} on=${info.ring.on} vsbg=${ratio ? ratio.toFixed(2) : '?'}`;
      if (process.argv.includes('--all') && theme === 'light') console.log(vp.w, line);
      if (info.ring.style === 'none' || info.ring.w < 2) problems.push('NO RING ' + line);
      else if (ratio !== null && ratio < 3) problems.push('RING CONTRAST ' + line);
      if (info.fullyHidden) problems.push('FOCUS HIDDEN ' + line); else if (info.obscuredTop || info.obscuredBottom) problems.push('FOCUS PARTLY OBSCURED ' + (info.obscuredTop ? 'by header ' : 'by phone bar ') + line);
    }
    console.log(`\n== ${theme} ${vp.w}: ${n} tab stops, ${problems.length} problems`); problems.forEach(x => console.log('  ' + x));
    await ctx.close();
  }
  await b.close();
})();
