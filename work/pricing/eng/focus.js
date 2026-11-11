const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return v; };
const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
(async () => {
  const b = await chromium.launch();
  for (const [w, h, theme] of [[390, 664, 'light'], [390, 664, 'dark'], [820, 1100, 'light'], [1440, 900, 'light'], [1440, 900, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', colorScheme: theme }); await block(ctx);
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    console.log(`\n===== ${w}x${h} ${theme} =====`);
    const seen = []; let problems = 0;
    for (let i = 0; i < 80; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(140);
      const f = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
        const hd = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const barShown = bar && bar.classList.contains('show') && getComputedStyle(bar).display !== 'none'; const barTop = barShown ? bar.getBoundingClientRect().top : innerHeight;
        // background behind the ring: walk up
        let bg = 'rgb(255,255,255)'; for (let e = a.parentElement; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; } }
        const inHeader = !!a.closest('.site-header, .topbar'), inBar = !!a.closest('#mobile-cta');
        // is the element actually hit-testable at its centre (not covered)?
        const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = r.top + r.height / 2; const top = document.elementFromPoint(cx, cy); const covered = cy >= 0 && cy <= innerHeight && top && !(a.contains(top) || top.contains(a));
        return { t: (a.getAttribute('aria-label') || a.textContent || a.id).trim().replace(/\s+/g, ' ').slice(0, 34), area: a.closest('main') ? 'main' : a.closest('footer') ? 'footer' : 'chrome', os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), oc: cs.outlineColor, off: cs.outlineOffset, bg, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), hdBottom: Math.round(hd.bottom), barTop: Math.round(barTop), inHeader, inBar, covered: covered ? (top.className || top.tagName).toString().slice(0, 30) : '', vh: innerHeight, y: Math.round(r.top + scrollY), x: Math.round(r.left) }; });
      if (!f) continue; seen.push(f);
      const issues = [];
      if (f.os === 'none' || f.ow < 2) issues.push('NO RING');
      else { const rr = ratio(parse(f.oc), parse(f.bg)); if (rr < 3) issues.push('ring contrast ' + rr.toFixed(2) + ' ' + f.oc + ' on ' + f.bg); }
      if (!f.inHeader && !f.inBar) { if (f.bottom <= f.hdBottom) issues.push('FULLY UNDER HEADER'); else if (f.top < f.hdBottom) issues.push('partly under header'); if (f.top >= f.barTop) issues.push('FULLY UNDER PHONE BAR'); else if (f.bottom > f.barTop) issues.push('partly under phone bar by ' + (f.bottom - f.barTop)); if (f.top > f.vh || f.bottom < 0) issues.push('OFFSCREEN'); }
      if (f.covered) issues.push('covered by ' + f.covered);
      if (issues.length) { problems++; console.log('  !!', f.area, JSON.stringify(f.t), issues.join('; '), `top=${f.top} bottom=${f.bottom}`); }
      if (f.area === 'footer' && seen.filter(s => s.area === 'footer').length > 2) break;
    }
    const main = seen.filter(s => s.area === 'main');
    console.log(`  stops: ${seen.length} (main ${main.length}); problems: ${problems}`);
    if (theme === 'light') console.log('  main order: ' + main.map(s => s.t).join(' > '));
    // order check: y then x monotonic-ish
    let back = []; for (let i = 1; i < main.length; i++) if (main[i].y < main[i - 1].y - 40) back.push(`${main[i - 1].t} -> ${main[i].t}`);
    console.log('  focus jumps upward:', back.length ? back.join(' | ') : 'none');
    await ctx.close();
  }
  await b.close();
})();
