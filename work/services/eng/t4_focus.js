const { chromium } = require('playwright');
const URL = 'http://localhost:8720/services/';
const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    console.log(`\n===== ${theme} ${vp.width}`);
    const seen = []; let problems = 0;
    for (let i = 0; i < 80; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const r = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
        const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
        const bgOf = e0 => { const stack = []; for (let e = e0; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        const oc = parse(cs.outlineColor); const bg = bgOf(el.parentElement || el); // ring is drawn outside the element: against the parent's background
        const ratio = oc ? (Math.max(lum(over(oc, bg)), lum(bg)) + 0.05) / (Math.min(lum(over(oc, bg)), lum(bg)) + 0.05) : 0;
        const hdr = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta');
        const barTop = bar && getComputedStyle(bar).display !== 'none' && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight;
        const inHeader = !!el.closest('.site-header, .topbar, .mobile-cta, .skip-link');
        const obscured = !inHeader && (rc.top < hdr.bottom - 1 || rc.bottom > barTop + 1 || rc.bottom > innerHeight || rc.top < 0);
        // clipped ring: any ancestor with overflow hidden that clips the outline?
        let clip = ''; for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e); if (/(hidden|clip|auto|scroll)/.test(o.overflow + o.overflowX + o.overflowY)) { const q = e.getBoundingClientRect(); if (rc.left - 6 < q.left || rc.right + 6 > q.right || rc.top - 6 < q.top || rc.bottom + 6 > q.bottom) clip = e.className; } }
        return { tag: el.tagName.toLowerCase() + '.' + (el.className.toString().split(' ').slice(0, 2).join('.')), txt: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 34), ow: cs.outlineWidth, os: cs.outlineStyle, oc: cs.outlineColor, off: cs.outlineOffset, ratio: +ratio.toFixed(2), top: Math.round(rc.top), bottom: Math.round(rc.bottom), w: Math.round(rc.width), h: Math.round(rc.height), hdrBottom: Math.round(hdr.bottom), barTop: Math.round(barTop), obscured, clip, inMain: !!el.closest('main') };
      });
      if (!r) break; const key = r.tag + r.txt; if (seen.includes(key)) break; seen.push(key);
      const bad = (r.os === 'none' || parseFloat(r.ow) < 2 || r.ratio < 3 || r.obscured || r.clip);
      if (bad) problems++;
      if (bad || process.argv.includes('-v')) console.log(`${bad ? 'BAD ' : 'ok  '} ${i + 1} ${r.tag} "${r.txt}" outline ${r.ow} ${r.os} ${r.oc} off ${r.off} ratio ${r.ratio} box ${r.top}-${r.bottom} (${r.w}x${r.h}) hdr ${r.hdrBottom} bar ${r.barTop}${r.obscured ? ' OBSCURED' : ''}${r.clip ? ' CLIPPED BY .' + r.clip : ''}`);
    }
    console.log(`${seen.length} tab stops, ${problems} problem(s)`);
    console.log('order:', seen.map(s => s.replace(/^[a-z]+\.[^ ]*?(?=[A-Z$\[(]|$)/, '')).join(' | ').slice(0, 1800));
    await ctx.close();
  }
  await b.close();
})();
