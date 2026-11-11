const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) { const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    for (const state of ['default', 'all-open/errors']) {
      if (state !== 'default') { if (path === '/faq/') await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); else { await p.setViewportSize({ width: 390, height: 900 }); await p.evaluate(() => document.getElementById('submit-btn').click()); await p.waitForTimeout(200); } }
      for (const w of [360, 390, 430, 768, 820, 1024, 1280, 1440, 1920]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80);
        const r = await p.evaluate(() => {
          const items = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const range = document.createRange();
          while ((n = walker.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('script,style,.sr-only,.hp,.skip-link,option,select,#nav,.mobile-cta,[hidden]')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue; let hid = false; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) hid = true; if (e.tagName === 'DETAILS' && !e.open && !el.closest('summary')) hid = true; } if (hid) continue; range.selectNodeContents(n); for (const rc of range.getClientRects()) { if (rc.width > 1 && rc.height > 1) items.push({ el, t: n.textContent.trim().slice(0, 22), l: rc.left, r: rc.right, tp: rc.top + scrollY, b: rc.bottom + scrollY, fixed: !!el.closest('.site-header,.topbar') }); } }
          const hits = new Set();
          for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const A = items[i], B = items[j]; if (A.el === B.el || A.fixed !== B.fixed) continue; if (A.el.closest('.stamp') || B.el.closest('.stamp')) { /* stamp is checked too */ } const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l), oy = Math.min(A.b, B.b) - Math.max(A.tp, B.tp); if (ox > 2 && oy > 4) hits.add(A.t + ' <> ' + B.t); }
          // vertical clipping
          const clip = []; for (const el of document.querySelectorAll('main *, .site-header *, .topbar *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || el.closest('.sr-only,.hp,#nav') || el.ownerSVGElement || /TEXTAREA|SELECT|INPUT/.test(el.tagName)) continue; if ((cs.overflowY === 'hidden' || cs.overflowY === 'clip') && el.scrollHeight > el.clientHeight + 2) clip.push(el.tagName + '.' + el.className); }
          return { hits: [...hits].slice(0, 6), clip: clip.slice(0, 4), n: items.length }; });
        if (r.hits.length || r.clip.length) console.log(path, state, w, JSON.stringify(r)); else console.log(path, state, w, 'ok (' + r.n + ' text boxes)'); } }
    await ctx.close(); }
  await b.close();
})();
