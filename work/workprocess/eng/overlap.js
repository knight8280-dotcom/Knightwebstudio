// Text overlap / clipping audit at given widths (after scrolling through so reveals are done).
const { chromium } = require('playwright');
const widths = (process.argv[2] || '320,340,360,390,430,600,760,768,820,980,1024,1100,1280,1440,1920').split(',').map(Number);
const themes = ['light'];
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const out = { overlaps: [], clipped: [], outside: [], pageOver: document.documentElement.scrollWidth - innerWidth, height: document.documentElement.scrollHeight };
      const items = [];
      const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (el.closest('.sr-only, svg, [hidden]')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const rects = [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1);
        if (!rects.length) continue;
        // skip if any ancestor is display none
        if (!el.offsetParent && cs.position !== 'fixed') continue;
        items.push({ el, n, rects, txt: n.textContent.trim().slice(0, 28) });
        // outside viewport horizontally
        for (const r of rects) if (r.right > innerWidth + 1 || r.left < -1) { out.outside.push(n.textContent.trim().slice(0, 30) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`); break; }
        // clipped by an overflow-hidden ancestor
        for (let a = el; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(hidden|clip)/.test(s.overflowX + s.overflowY)) { const ar = a.getBoundingClientRect(); for (const r of rects) if (r.right > ar.right + 1.5 || r.left < ar.left - 1.5 || r.bottom > ar.bottom + 2 || r.top < ar.top - 2) { out.clipped.push(n.textContent.trim().slice(0, 30) + ' clipped by ' + a.tagName + '.' + a.className); break; } } }
      }
      // also add non-text objects: stamp, images, buttons
      const objs = [...document.querySelectorAll('main .stamp, main img, main .btn, main .browser-bar, main .ticket-head')].map(el => ({ el, rects: [el.getBoundingClientRect()], txt: '<' + el.tagName + '.' + el.className + '>' })).filter(o => o.rects[0].width > 1);
      const all = items.concat(objs);
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const A = all[i], B = all[j]; if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
        let hit = false;
        for (const ra of A.rects) { for (const rb of B.rects) { const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); if (ox > 2 && oy > 3) { hit = [Math.round(ox), Math.round(oy)]; break; } } if (hit) break; }
        if (hit) out.overlaps.push(`"${A.txt}" x "${B.txt}" by ${hit}`);
      }
      return out;
    });
    const bad = r.overlaps.length || r.clipped.length || r.outside.length || r.pageOver > 0;
    console.log(path, w, 'h=' + r.height, bad ? JSON.stringify({ overlaps: r.overlaps.slice(0, 8), clipped: r.clipped.slice(0, 6), outside: r.outside.slice(0, 6), pageOver: r.pageOver }) : 'clean');
    await ctx.close();
  }
  await b.close();
})();
