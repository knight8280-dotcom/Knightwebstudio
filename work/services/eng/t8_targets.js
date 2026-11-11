const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 820]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 800, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    const r = await p.evaluate(() => {
      const t = []; for (const el of document.querySelectorAll('main a, main button, main summary')) { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const rc = el.getBoundingClientRect(); if (!rc.width) continue; t.push([Math.round(rc.width), Math.round(rc.height), el.className.toString().split(' ')[0] || el.tagName, el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), Math.round(rc.top + scrollY)]); }
      // spacing between adjacent targets (vertical gap) for small ones
      const small = new Map(); const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('svg, .sr-only')) continue; const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); if (rc.width < 2 || cs.visibility === 'hidden' || cs.display === 'none') continue; const fs = parseFloat(cs.fontSize); if (fs >= 15) continue; const k = `${fs}px ${cs.textTransform === 'uppercase' ? 'CAPS' : ''} .${el.className.toString().split(' ')[0] || el.tagName}`; if (!small.has(k)) small.set(k, n.textContent.trim().slice(0, 30)); }
      // measure line length (chars per line) of body paragraphs
      const meas = [...document.querySelectorAll('main p, main li')].filter(e => e.getBoundingClientRect().width && !e.closest('.phone, .appt, .menu') && e.textContent.trim().length > 80).map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const lines = new Set([...rg.getClientRects()].map(q => Math.round(q.top))).size; return [Math.round(e.textContent.trim().length / lines), e.textContent.trim().slice(0, 24), parseFloat(getComputedStyle(e).fontSize)]; });
      return { t, small: [...small.entries()], meas };
    });
    console.log(`\n== ${w}`); console.log(' targets under 44px tall or 24 wide:', JSON.stringify(r.t.filter(x => x[1] < 43.5 || x[0] < 24)));
    console.log(' all targets:', r.t.map(x => `${x[0]}x${x[1]} ${x[3]}`).join(' | '));
    console.log(' text under 15px:', JSON.stringify(r.small));
    console.log(' chars per line:', r.meas.map(m => `${m[0]} (${m[2]}px "${m[1]}")`).join(' ; '));
    await ctx.close();
  }
  await b.close();
})();
