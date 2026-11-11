const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); fs.mkdirSync('focus', { recursive: true });
  for (const path of ['/work/', '/process/']) for (const theme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, hasTouch: w < 500, isMobile: w < 500 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(500);
    // first scroll through so the bar state machine is live, then return to top
    const rows = []; let prevKey = null; let shot = 0;
    for (let i = 0; i < 70; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(420);
      const r = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
        const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const bgOf = e => { for (; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a === 1) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
        const oc = parse(cs.outlineColor); const bg = bgOf(el.parentElement); const ratio = oc ? (Math.max(lum(oc), lum(bg)) + .05) / (Math.min(lum(oc), lum(bg)) + .05) : 0;
        const hdr = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const barShown = bar && bar.classList.contains('show') && getComputedStyle(bar).visibility !== 'hidden' && getComputedStyle(bar).display !== 'none'; const br = bar ? bar.getBoundingClientRect() : null;
        const inHeader = !!el.closest('.site-header, .topbar, .skip-link, #mobile-cta');
        let obscured = '';
        if (!inHeader) { if (rc.top < hdr.bottom - 1 && rc.bottom > hdr.top) obscured += ` under header by ${Math.round(Math.min(rc.bottom, hdr.bottom) - rc.top)}px of ${Math.round(rc.height)}`; if (barShown && rc.bottom > br.top + 1) obscured += ` under phone bar by ${Math.round(rc.bottom - br.top)}px of ${Math.round(rc.height)}`; if (rc.bottom > innerHeight || rc.top < 0) obscured += ' partly off screen'; }
        return { key: el.tagName + '|' + el.className + '|' + el.textContent.trim().slice(0, 20) + '|' + Math.round(rc.top + scrollY), tag: el.tagName.toLowerCase() + '.' + (el.className.toString().split(' ').slice(0, 2).join('.')), txt: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off ' + cs.outlineOffset, ratio: +ratio.toFixed(2), obscured, inMain: !!el.closest('main'), box: [Math.round(rc.left), Math.round(rc.top), Math.round(rc.width), Math.round(rc.height)], barShown };
      });
      if (!r) break; if (rows.find(x => x.key === r.key)) break; rows.push(r);
      if (r.inMain) { shot++; await p.screenshot({ path: `focus/${path.replace(/\//g, '')}_${theme}_${w}_${String(shot).padStart(2, '0')}.png` }); }
    }
    console.log(`\n== ${path} ${theme} ${w}: ${rows.length} tab stops`);
    for (const r of rows) { const bad = !/solid|auto/.test(r.outline) || parseFloat(r.outline.split(' ')[1]) < 2 || r.ratio < 3 || r.obscured; if (r.inMain || bad) console.log((bad ? '  !! ' : '     ') + r.tag.padEnd(26) + ' "' + r.txt + '" ' + r.outline + ' ratio ' + r.ratio + (r.obscured ? ' OBSCURED:' + r.obscured : '') + ' box ' + r.box.join(',') + (r.barShown ? ' (bar shown)' : '')); }
    await ctx.close();
  }
  await b.close();
})();
