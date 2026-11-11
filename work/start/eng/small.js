const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 430]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const m = new Map(); const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('script,style,svg,.sr-only,[hidden]')) continue; const cs = getComputedStyle(el); let e = el, hid = false; while (e) { const c = getComputedStyle(e); if (c.display === 'none') { hid = true; break; } e = e.parentElement; } if (hid) continue; const fs = parseFloat(cs.fontSize); if (fs >= 15) continue; const k = fs + 'px ' + cs.textTransform + ' ' + el.tagName.toLowerCase() + '.' + el.className.toString().split(' ')[0]; m.set(k, n.textContent.trim().slice(0, 30)); } return [...m.entries()]; });
    console.log(w, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
