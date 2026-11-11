const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sizes = (process.argv[2] || '390x844,820x1100,1280x800').split(',').map(s => s.split('x').map(Number));
const back = process.argv[3] === 'back';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) for (const theme of ['light']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
    const seen = []; const problems = [];
    if (back) { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); }
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press(back ? 'Shift+Tab' : 'Tab'); await p.waitForTimeout(650);
      const r = await p.evaluate(() => {
        const a = document.activeElement; if (!a || a === document.body) return null;
        const rc = a.getBoundingClientRect(); const cs = getComputedStyle(a);
        const hdr = document.querySelector('.site-header').getBoundingClientRect(); const bar = document.querySelector('.mobile-cta'); const bcs = bar && getComputedStyle(bar);
        const barShown = bar && bcs.display !== 'none' && bcs.visibility !== 'hidden' && +bcs.opacity > 0.5 && bar.getBoundingClientRect().top < innerHeight - 4;
        const barTop = barShown ? bar.getBoundingClientRect().top : innerHeight;
        const hdrB = getComputedStyle(document.querySelector('.site-header')).position === 'sticky' || getComputedStyle(document.querySelector('.site-header')).position === 'fixed' ? Math.max(0, hdr.bottom) : 0;
        const inHeader = !!a.closest('.site-header, .topbar, .mobile-cta, .skip-link');
        const visTop = Math.max(rc.top, inHeader ? 0 : hdrB), visBot = Math.min(rc.bottom, inHeader ? innerHeight : barTop);
        const visFrac = rc.height ? Math.max(0, visBot - visTop) / rc.height : 0;
        // topmost element at centre
        const cx = Math.min(innerWidth - 1, Math.max(0, rc.left + rc.width / 2)), cy = rc.top + rc.height / 2; const top = document.elementFromPoint(cx, cy);
        const covered = top && !(a.contains(top) || top.contains(a)) ? (top.className && top.className.toString()) || top.tagName : '';
        return { name: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), tag: a.tagName, cls: a.className.toString().slice(0, 30), top: Math.round(rc.top), bottom: Math.round(rc.bottom), h: Math.round(rc.height), w: Math.round(rc.width), hdrB: Math.round(hdrB), barTop: Math.round(barTop), visFrac: +visFrac.toFixed(2), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off ' + cs.outlineOffset, shadow: cs.boxShadow.slice(0, 60), covered, opacity: (() => { let o = 1; for (let e = a; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return +o.toFixed(2); })(), inHeader };
      });
      if (!r) continue; const key = r.tag + r.name + r.cls; if (seen.includes(key) && i > 5) break; seen.push(key);
      const flags = [];
      if (r.visFrac < 1 && !r.inHeader) flags.push(r.visFrac === 0 ? 'FULLY-OBSCURED' : 'partly-obscured ' + r.visFrac);
      if (!/solid|auto|double/.test(r.outline) || /^[a-z]+ 0px/.test(r.outline)) flags.push('NO-OUTLINE ' + r.outline + ' | ' + r.shadow);
      if (r.covered && !r.inHeader) flags.push('covered-by ' + r.covered);
      if (r.opacity < 1) flags.push('opacity ' + r.opacity);
      console.log(`${w} ${String(i + 1).padStart(2)} ${r.tag} "${r.name}" top ${r.top} bot ${r.bottom} (hdr ${r.hdrB} bar ${r.barTop}) ${r.outline}${flags.length ? '  <<< ' + flags.join('; ') : ''}`);
    }
    await ctx.close();
  }
  await b.close();
})();
