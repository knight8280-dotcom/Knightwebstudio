const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ w: 390, h: 844 }, { w: 820, h: 1100 }, { w: 1440, h: 900 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const id of ['time', 'how', 'calculator', 'process', 'services', 'plans', 'bundle', 'consulting-faq']) {
      const p = await ctx.newPage(); await p.goto(URL + '#' + id, { waitUntil: 'load' }); await p.waitForTimeout(700);
      const a = await p.evaluate(i => { const el = document.getElementById(i); const h = document.querySelector('.site-header').getBoundingClientRect(); const r = el.getBoundingClientRect();
        // first visible text inside the target
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let first = null; while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const pe = n.parentElement; if (pe.closest('.sr-only')) continue; const rr = pe.getBoundingClientRect(); if (rr.width && rr.height && getComputedStyle(pe).visibility !== 'hidden') { first = { t: n.textContent.trim().slice(0, 30), top: Math.round(rr.top), op: getComputedStyle(pe.closest('.reveal') || pe).opacity }; break; } }
        return { top: Math.round(r.top), headerBottom: Math.round(h.bottom), first, scrollY: Math.round(scrollY) }; }, id);
      console.log(vp.w, '#' + id, JSON.stringify(a), a.top >= a.headerBottom - 1 && a.top < 200 ? 'ok' : 'CHECK');
      if (['services', 'plans', 'process'].includes(id) && vp.w !== 820) await p.screenshot({ path: `anchor-${id}-${vp.w}.png` });
      await p.close();
    }
    await ctx.close();
  }
  await b.close();
})();
