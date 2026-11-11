const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820, 1100, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const out = []; const name = e => e.tagName.toLowerCase() + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
      const over = document.documentElement.scrollWidth - innerWidth; if (over > 0) out.push('PAGE OVERFLOW +' + over);
      const vis = e => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
      const items = []; const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg, .sr-only, [hidden]') || !vis(el)) continue; if (el.closest('thead') && getComputedStyle(el.closest('thead')).position === 'absolute') continue;
        const rg = document.createRange(); rg.selectNodeContents(n); for (const rc of rg.getClientRects()) if (rc.width > 1 && rc.height > 1) items.push({ el, rc, t: n.textContent.trim().slice(0, 22) }); }
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i], c = items[j]; if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el)) continue; const x = Math.min(a.rc.right, c.rc.right) - Math.max(a.rc.left, c.rc.left), y = Math.min(a.rc.bottom, c.rc.bottom) - Math.max(a.rc.top, c.rc.top); if (x > 3 && y > 6) out.push(`OVERLAP "${a.t}" x "${c.t}" ${Math.round(x)}x${Math.round(y)}`); }
      for (const e of document.querySelectorAll('main *')) { if (!vis(e) || e.closest('svg,.sr-only,thead')) continue; const cs = getComputedStyle(e); if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) out.push('CLIP ' + name(e)); const rc = e.getBoundingClientRect(); if (rc.right > innerWidth + 1 && !e.closest('.tilt')) out.push('PAST EDGE ' + name(e) + ' +' + Math.round(rc.right - innerWidth)); }
      const seal = document.querySelector('.toc-seal'); if (seal && vis(seal)) { const s = seal.getBoundingClientRect(); for (const it of items) { if (!it.el.closest('.toc')) continue; const x = Math.min(s.right, it.rc.right) - Math.max(s.left, it.rc.left), y = Math.min(s.bottom, it.rc.bottom) - Math.max(s.top, it.rc.top); if (x > 6 && y > 6) out.push(`SEAL over "${it.t}" ${Math.round(x)}x${Math.round(y)}`); } }
      return [...new Set(out)].slice(0, 12); });
    console.log(w, 'WCAG 1.4.12 text spacing:', r.length ? '\n   ' + r.join('\n   ') : 'no loss');
    if (r.length && (w === 390 || w === 1280)) { const y = await p.evaluate(() => document.querySelector('.spec').getBoundingClientRect().top + scrollY - 20); await p.screenshot({ path: `shots/spacing-${w}.png`, fullPage: true, clip: { x: 0, y, width: w, height: 900 } }); }
    await ctx.close();
  }
  await b.close();
})();
