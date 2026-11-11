const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await block(ctx); const p = await ctx.newPage(); await p.goto(base + '/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    for (let w = 360; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(70);
      const r = await p.evaluate(() => {
        const out = [];
        const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
        const vis = e => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
        // 1 clipping
        for (const e of document.querySelectorAll('main *')) { if (!vis(e) || e.closest('svg, .sr-only') ) continue; const cs = getComputedStyle(e);
          if (e.closest('thead') && getComputedStyle(e.closest('thead')).position === 'absolute') continue;
          if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) out.push('CLIP ' + name(e) + ` ${e.scrollWidth}>${e.clientWidth} / ${e.scrollHeight}>${e.clientHeight}`); }
        // 2 text rect overlaps between unrelated elements
        const items = [];
        const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg, .sr-only, [hidden]') || !vis(el)) continue;
          if (el.closest('thead') && getComputedStyle(el.closest('thead')).position === 'absolute') continue;
          const rg = document.createRange(); rg.selectNodeContents(n); for (const rc of rg.getClientRects()) if (rc.width > 1 && rc.height > 1) items.push({ el, rc, t: n.textContent.trim().slice(0, 24) }); }
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i], c = items[j]; if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el)) continue;
          const x = Math.min(a.rc.right, c.rc.right) - Math.max(a.rc.left, c.rc.left), y = Math.min(a.rc.bottom, c.rc.bottom) - Math.max(a.rc.top, c.rc.top);
          if (x > 2 && y > 4) out.push(`OVERLAP "${a.t}" (${name(a.el)}) x "${c.t}" (${name(c.el)}) ${Math.round(x)}x${Math.round(y)}`); }
        // 3 seal vs toc text
        const seal = document.querySelector('.toc-seal'); if (seal && vis(seal)) { const s = seal.getBoundingClientRect();
          for (const it of items) { if (!it.el.closest('.toc')) continue; const x = Math.min(s.right, it.rc.right) - Math.max(s.left, it.rc.left), y = Math.min(s.bottom, it.rc.bottom) - Math.max(s.top, it.rc.top); if (x > 0 && y > 0) out.push(`SEAL over "${it.t}" ${Math.round(x)}x${Math.round(y)}`); }
          const hd = document.querySelector('.header-inner').getBoundingClientRect(); if (s.top < hd.bottom) out.push('SEAL under header by ' + Math.round(hd.bottom - s.top));
          if (s.right > innerWidth) out.push('SEAL past viewport ' + Math.round(s.right - innerWidth)); }
        // 4 buttons: line count in spec-act and table, header cta
        const lines = e => { const cs = getComputedStyle(e); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; const rg = document.createRange(); rg.selectNodeContents(e); const ys = new Set([...rg.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4))); return ys.size; };
        const btnInfo = [...document.querySelectorAll('.spec-act .btn, .table .btn, .header-cta, .page-head .btn, #consulting .btn, .cta-band .btn')].filter(vis).map(e => ({ t: e.textContent.trim().slice(0, 22), l: lines(e), h: Math.round(e.getBoundingClientRect().height), y: Math.round(e.getBoundingClientRect().top + scrollY) }));
        const multi = btnInfo.filter(x => x.l > 1).map(x => `${x.t}:${x.l} lines/${x.h}px`);
        if (multi.length) out.push('WRAPPED BUTTONS ' + multi.join(', '));
        // spec-act alignment in table mode
        if (innerWidth >= 1100) { const ys = [...document.querySelectorAll('.spec-act .btn-block')].map(e => Math.round(e.getBoundingClientRect().top + scrollY)); const hs = [...document.querySelectorAll('.spec-act .btn-block')].map(e => Math.round(e.getBoundingClientRect().height)); if (new Set(ys).size > 1 || new Set(hs).size > 1) out.push('SPEC BUTTONS MISALIGNED y=' + ys + ' h=' + hs);
          const qs = [...document.querySelectorAll('.spec-act .btn-quiet')].map(e => Math.round(e.getBoundingClientRect().top + scrollY)); if (new Set(qs).size > 1) out.push('QUIET LINKS MISALIGNED ' + qs); }
        // popular tab position relative to its row + name
        const pop = document.querySelector('.spec .popular'); if (pop) { const pr = pop.getBoundingClientRect(), tr = pop.closest('tr').getBoundingClientRect(); const nm = pop.closest('th'); const rg = document.createRange(); rg.setStart(nm.firstChild, 0); rg.setEnd(nm.firstChild, nm.firstChild.length); const nr = rg.getBoundingClientRect();
          if (Math.min(pr.bottom, nr.bottom) - Math.max(pr.top, nr.top) > 0 && Math.min(pr.right, nr.right) - Math.max(pr.left, nr.left) > 0) out.push('POPULAR over name'); out.push(`pop: tabTop-rowTop=${Math.round(pr.top - tr.top)} gapToName=${Math.round(nr.top - pr.bottom)}`); }
        return { out, H: document.documentElement.scrollHeight };
      });
      const sig = r.out.filter(x => !/^pop:/.test(x));
      console.log(w, 'H=' + r.H, r.out.find(x => /^pop:/.test(x)) || '', sig.length ? '\n   ' + sig.join('\n   ') : '');
    }
    await ctx.close();
  }
  await b.close();
})();
