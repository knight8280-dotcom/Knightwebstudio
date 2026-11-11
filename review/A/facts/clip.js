const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.waitForTimeout(250);
      const res = await p.evaluate(() => {
        document.querySelectorAll('details').forEach(d => d.open = true);
        const out = [];
        for (const e of document.querySelectorAll('main *, .topbar *, .site-header *, .mobile-cta *')) {
          const cs = getComputedStyle(e);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (e.closest('svg,.sr-only,[hidden],select')) continue;
          if (!e.textContent.trim()) continue;
          const ov = cs.overflowY !== 'visible' || cs.overflowX !== 'visible';
          if (!ov) continue;
          if (e.clientWidth < 4 || e.clientHeight < 4) continue;
          const dh = e.scrollHeight - e.clientHeight, dw = e.scrollWidth - e.clientWidth;
          if ((dh > 3 && cs.overflowY === 'hidden') || (dw > 3 && (cs.overflowX === 'hidden' || cs.overflowX === 'clip'))) {
            // is any text rect of a descendant outside the box?
            const box = e.getBoundingClientRect(); let cut = '';
            const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n;
            while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const pe = n.parentElement; if (pe.closest('.sr-only,svg') || getComputedStyle(pe).visibility === 'hidden' || getComputedStyle(pe).display === 'none') continue; const r = document.createRange(); r.selectNodeContents(n); for (const rc of r.getClientRects()) { if (rc.width < 1) continue; if (rc.bottom > box.bottom + 2 || rc.right > box.right + 2 || rc.left < box.left - 2 || rc.top < box.top - 2) { cut = n.nodeValue.trim().slice(0, 50); break; } } if (cut) break; }
            if (cut) out.push(e.tagName.toLowerCase() + '.' + (e.className || '').toString().replace(/\s+/g, '.') + ' dh=' + dh + ' dw=' + dw + ' cut text: "' + cut + '"');
          }
        }
        return out;
      });
      if (res.length) { console.log(w + ' ' + path); res.slice(0, 8).forEach(x => console.log('    ' + x)); }
    }
    await ctx.close();
  }
  await b.close(); console.log('done');
})();
