const { firefox } = require('playwright'); const fs = require('fs');
(async () => {
  fs.mkdirSync('ff', { recursive: true });
  const b = await firefox.launch();
  const ws = []; for (let w = 360; w <= 1920; w += 20) ws.push(w); ws.push(320, 379, 599, 759, 979, 1099, 1279);
  for (const path of ['/work/', '/process/']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    let bad = 0; const heights = {};
    for (const w of ws) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(90);
      const r = await p.evaluate(() => {
        const out = { over: document.documentElement.scrollWidth - innerWidth, poke: [], overlaps: [], h: document.documentElement.scrollHeight, wraps: [] };
        for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('.sr-only,.hp,svg,[hidden],.nav')) continue; const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue; if (rc.right > innerWidth + .5 || rc.left < -.5) out.poke.push(el.tagName + '.' + (el.className.toString()) + ` ${Math.round(rc.left)}..${Math.round(rc.right)}`); }
        const items = []; const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only, svg, [hidden], h1')) continue; if (!el.offsetParent) continue; const rg = document.createRange(); rg.selectNodeContents(n); const rects = [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1); if (rects.length) items.push({ el, rects, txt: n.textContent.trim().slice(0, 24) }); }
        const objs = [...document.querySelectorAll('main .stamp, main img, main .btn')].map(el => ({ el, rects: [el.getBoundingClientRect()], txt: '<' + el.className + '>' })).filter(o => o.rects[0].width > 1);
        const all = items.concat(objs);
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const A = all[i], B = all[j]; if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue; for (const ra of A.rects) for (const rb of B.rects) { const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); if (ox > 2 && oy > 3) out.overlaps.push(`"${A.txt}" x "${B.txt}"`); } }
        for (const d of document.querySelectorAll('main .steps dl div')) { const dd = d.querySelector('dd'), dt = d.querySelector('dt'); if (Math.abs(dd.getBoundingClientRect().top - dt.getBoundingClientRect().top) > 8 || dd.getBoundingClientRect().height > 30) out.wraps.push(dt.textContent + ':' + dd.textContent); }
        return out;
      });
      heights[w] = r.h;
      if (r.over > 0 || r.poke.length || r.overlaps.length || r.wraps.length) { bad++; console.log('FF', path, w, JSON.stringify({ over: r.over, poke: r.poke.slice(0, 4), overlaps: [...new Set(r.overlaps)].slice(0, 4), wraps: r.wraps })); }
    }
    console.log('FF', path, bad ? bad + ' widths flagged' : 'clean at ' + ws.length + ' widths', 'heights 360/390/820/1440:', heights[360], heights[380], heights[820], heights[1440], 'errors:', errs);
    await ctx.close();
    for (const [w, h] of [[390, 844], [820, 1100], [1440, 900]]) for (const theme of ['light', 'dark']) {
      const c2 = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' }); await c2.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
      await c2.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p2 = await c2.newPage(); await p2.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p2.waitForTimeout(500);
      const H = await p2.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += 500) { await p2.evaluate(yy => scrollTo(0, yy), y); await p2.waitForTimeout(100); } await p2.evaluate(() => scrollTo(0, 0)); await p2.waitForTimeout(300);
      if (theme === 'light' || w === 390) await p2.screenshot({ path: `ff/${path.replace(/\//g, '')}_${w}_${theme}.png`, fullPage: true });
      console.log('FF height', path, w, theme, H);
      await c2.close();
    }
  }
  await b.close();
})();
