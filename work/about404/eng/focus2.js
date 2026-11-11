const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [820, 1100], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(1200);
    const out = [];
    for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(700);
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e.closest('main')) return e.closest('footer') ? 'footer' : null; const r = e.getBoundingClientRect(); const hdr = document.querySelector('.site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const barOn = bar && getComputedStyle(bar).display !== 'none' && bar.classList.contains('show'); const bt = barOn ? bar.getBoundingClientRect().top : innerHeight; let op = 1; for (let x = e; x; x = x.parentElement) op *= +getComputedStyle(x).opacity;
        return { t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 26), top: Math.round(r.top), bottom: Math.round(r.bottom), hdrBottom: Math.round(hdr.bottom), barTop: Math.round(bt), opacity: +op.toFixed(2), ringClearTop: Math.round(r.top - 6 - hdr.bottom), ringClearBottom: Math.round(bt - (r.bottom + 6)) }; });
      if (s === 'footer') break; if (s) out.push(s); }
    console.log(`\n@${w}x${h}`); for (const s of out) console.log(`  "${s.t}" top ${s.top} bottom ${s.bottom} | header bottom ${s.hdrBottom} bar top ${s.barTop} | opacity ${s.opacity} | ring clear of header by ${s.ringClearTop}px, of bar/viewport by ${s.ringClearBottom}px${s.ringClearTop < 0 || s.ringClearBottom < 0 ? '  <-- OBSCURED' : ''}${s.opacity < 1 ? '  <-- FADED' : ''}`);
    await ctx.close(); }
  // text spacing (WCAG 1.4.12)
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const path of ['/about/', '/404.html']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}' }); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));
    const r = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('main *')) { if (el.ownerSVGElement || el.closest('.sr-only')) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width) continue; if (r.right > innerWidth + 1 && !el.closest('.tilt')) out.push('OUT ' + el.tagName + '.' + el.className + ' right ' + Math.round(r.right)); if ((cs.overflow !== 'visible') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) out.push('CLIP ' + el.tagName + '.' + el.className); }
      // text escaping fixed-height boxes
      for (const el of document.querySelectorAll('main .btn, main .towns li, main .projects a, main .bizcard, main .appt')) { const r = el.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); const t = rg.getBoundingClientRect(); if (t.bottom > r.bottom + 2 || t.right > r.right + 2) if (!el.closest('.tilt')) out.push('TEXT ESCAPES ' + el.tagName + '.' + el.className + ' ' + Math.round(t.right - r.right) + 'x' + Math.round(t.bottom - r.bottom)); }
      return { over: document.documentElement.scrollWidth - innerWidth, out: [...new Set(out)].slice(0, 8) }; });
    console.log(`text-spacing ${path} @${w}:`, JSON.stringify(r));
    await p.screenshot({ path: __dirname + `/lshots/spacing-${path.replace(/\W/g, '')}-${w}.png`, fullPage: true });
    await ctx.close(); }
  await b.close(); })();
