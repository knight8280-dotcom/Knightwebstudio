const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8720/services/';
(async () => {
  const b = await chromium.launch();
  for (const state of ['default', 'all-open']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    if (state === 'all-open') await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    console.log('\n===== state:', state);
    const rowsLog = [];
    for (let w = 360; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(50);
      const r = await p.evaluate(() => {
        const sel = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
        const issues = [];
        const over = document.documentElement.scrollWidth - innerWidth; if (over > 0) issues.push('PAGE WIDER by ' + over);
        const all = [...document.querySelectorAll('main *')];
        for (const el of all) {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.sr-only')) continue; { const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue; }
          if (el.ownerSVGElement) continue;
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
          if (rc.right > innerWidth + .5 || rc.left < -.5) issues.push(`OUT OF VIEWPORT ${sel(el)} ${Math.round(rc.left)}..${Math.round(rc.right)}`);
          // sticks out of its parent's content box horizontally
          const par = el.parentElement; if (par && par !== document.body) { const pr = par.getBoundingClientRect(); if (rc.right > pr.right + 1.5 || rc.left < pr.left - 1.5) { if (!/absolute|fixed/.test(cs.position) && !el.closest('.phone, .appt, svg') ) issues.push(`STICKS OUT OF PARENT ${sel(el)} in ${sel(par)} by ${Math.round(Math.max(rc.right - pr.right, pr.left - rc.left))}`); } }
          if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) issues.push(`CLIPPED CONTENT ${sel(el)} ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`);
          if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) issues.push(`SIDEWAYS SCROLLER ${sel(el)}`);
        }
        // text overlap: rects of text nodes
        const rects = []; const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only, svg')) continue; const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) rects.push({ el, q, t: n.textContent.trim().slice(0, 24) }); }
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], c = rects[j]; if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el)) continue;
          const ix = Math.min(a.q.right, c.q.right) - Math.max(a.q.left, c.q.left), iy = Math.min(a.q.bottom, c.q.bottom) - Math.max(a.q.top, c.q.top);
          if (ix > 2 && iy > 0.45 * Math.min(a.q.height, c.q.height)) issues.push(`TEXT OVERLAP "${a.t}" (${sel(a.el)}) x "${c.t}" (${sel(c.el)}) ${Math.round(ix)}x${Math.round(iy)}`); }
        // text vs. other painted boxes: phone over text etc. (boxes with background that are not ancestors)
        const menuRows = [...document.querySelectorAll('.menu a')].map(a => Math.round(a.getBoundingClientRect().height));
        const plRows = [...document.querySelectorAll('main summary')].map(a => Math.round(a.getBoundingClientRect().height));
        const board = document.querySelector('.menu').getBoundingClientRect();
        const dots = [...document.querySelectorAll('main .dots')].filter(d => getComputedStyle(d).display !== 'none').map(d => Math.round(d.getBoundingClientRect().width));
        return { issues: [...new Set(issues)], menuRows, plRows, boardH: Math.round(board.height), boardTop: Math.round(board.top + scrollY), H: document.documentElement.scrollHeight, minDots: Math.min(...dots) };
      });
      if (r.issues.length) console.log(w + 'px:\n   ' + r.issues.slice(0, 12).join('\n   '));
      rowsLog.push(`${w}: H ${r.H} board ${r.boardH}@${r.boardTop} menu[${r.menuRows.join(',')}] rows[${r.plRows.join(',')}] minDots ${r.minDots}`);
    }
    console.log(rowsLog.filter((_, i) => i % 2 === 0 || true).join('\n'));
    await ctx.close();
  }
  await b.close();
})();
