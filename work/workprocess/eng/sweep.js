// every 20px 360..1920 (plus 10px offsets near breakpoints): page overflow, element poke-out, text overlap, stamp position, both motion modes
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ws = []; for (let w = 360; w <= 1920; w += 20) ws.push(w); for (const x of [379, 381, 599, 601, 759, 761, 979, 981, 1099, 1101, 1279, 1281]) ws.push(x);
  for (const path of ['/work/', '/process/']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    let bad = 0;
    for (const w of ws) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80);
      const r = await p.evaluate(() => {
        const out = { over: document.documentElement.scrollWidth - innerWidth, poke: [], overlaps: [], wraps: [] };
        for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('.sr-only,.hp,svg,[hidden],.nav')) continue; const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue; if (rc.right > innerWidth + .5 || rc.left < -.5) out.poke.push(el.tagName + '.' + (el.className.toString()) + ` ${Math.round(rc.left)}..${Math.round(rc.right)}`); }
        const items = []; const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only, svg, [hidden], h1')) continue; if (!el.offsetParent) continue; const rg = document.createRange(); rg.selectNodeContents(n); const rects = [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1); if (rects.length) items.push({ el, rects, txt: n.textContent.trim().slice(0, 24) }); }
        const objs = [...document.querySelectorAll('main .stamp, main img, main .btn')].map(el => ({ el, rects: [el.getBoundingClientRect()], txt: '<' + el.className + '>' })).filter(o => o.rects[0].width > 1);
        const all = items.concat(objs);
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const A = all[i], B = all[j]; if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue; for (const ra of A.rects) for (const rb of B.rects) { const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); if (ox > 2 && oy > 3) { out.overlaps.push(`"${A.txt}" x "${B.txt}"`); } } }
        // dl rows that wrap to two lines (dd height)
        for (const d of document.querySelectorAll('main .steps dl div, main .case-facts div')) { const dd = d.querySelector('dd'), dt = d.querySelector('dt'); const lh = parseFloat(getComputedStyle(dd).lineHeight); if (dd.getBoundingClientRect().height > lh * 1.6 || Math.abs(dd.getBoundingClientRect().top - dt.getBoundingClientRect().top) > lh) out.wraps.push(dt.textContent + ':' + dd.textContent.trim().slice(0, 22)); }
        const st = document.querySelector('main .stamp'); if (st) { const s = st.getBoundingClientRect(), t = document.querySelector('.ticket').getBoundingClientRect(), last = document.querySelector('.steps > li:last-child .steps-you').getBoundingClientRect(); out.stamp = [Math.round(s.left - t.left), Math.round(t.right - s.right), Math.round(s.top - last.bottom), Math.round(s.bottom - t.bottom)]; }
        return out;
      });
      const flag = r.over > 0 || r.poke.length || r.overlaps.length;
      if (flag) { bad++; console.log(path, w, JSON.stringify({ over: r.over, poke: r.poke.slice(0, 4), overlaps: [...new Set(r.overlaps)].slice(0, 5) })); }
      if (r.wraps.length || (w % 100 === 0 || w === 360 || w === 390)) console.log('   ', path, w, 'wraps:', JSON.stringify(r.wraps), 'stamp[l,r,gapAboveFromLastYou,belowTicket]:', JSON.stringify(r.stamp));
    }
    console.log(path, bad ? bad + ' widths with problems' : 'clean at all ' + ws.length + ' widths');
    await ctx.close();
  }
  await b.close();
})();
