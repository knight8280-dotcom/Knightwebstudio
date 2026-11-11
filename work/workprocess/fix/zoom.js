const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  fs.mkdirSync('zoom', { recursive: true });
  const b = await chromium.launch();
  const measure = () => {
    const out = { over: document.documentElement.scrollWidth - innerWidth, poke: [], clipped: [] };
    for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('.sr-only,svg,[hidden]')) continue; const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue; if (rc.right > innerWidth + 1 || rc.left < -1) out.poke.push(el.tagName + '.' + el.className + ` ${Math.round(rc.left)}..${Math.round(rc.right)}`);
      if (/(hidden|clip)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) out.clipped.push(el.tagName + '.' + el.className + ' clips ' + (el.scrollWidth - el.clientWidth) + 'px'); }
    // text ranges outside their block ancestors (e.g. ticket)
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); const outside = [];
    while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only,svg,[hidden]') || !el.offsetParent) continue; const box = el.closest('.ticket, .browser, .case-copy, .btn, .cta-copy, .container'); if (!box) continue; const br = box.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1 && (r.right > br.right + 1 || r.left < br.left - 1)) { outside.push(n.textContent.trim().slice(0, 24) + ' outside ' + box.className.split(' ')[0] + ' by ' + Math.round(Math.max(r.right - br.right, br.left - r.left))); break; } }
    out.outside = outside; return out;
  };
  for (const path of ['/work/', '/process/']) {
    for (const [w, fs_] of [[390, 200], [360, 200], [1280, 200], [820, 200], [390, 150]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.addStyleTag({ content: `html{font-size:${fs_}% !important}` }); await p.waitForTimeout(300);
      const r = await p.evaluate(measure);
      console.log(`text zoom ${fs_}% ${path} ${w}:`, JSON.stringify({ over: r.over, poke: r.poke.slice(0, 5), clipped: r.clipped.slice(0, 5), outside: r.outside.slice(0, 6) }));
      if (fs_ === 200 && (w === 390 || w === 1280)) await p.screenshot({ path: `zoom/${path.replace(/\//g, '')}_${w}_200.png`, fullPage: true });
      await ctx.close();
    }
    // long words
    for (const w of [360, 390, 820, 1280]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.evaluate(() => {
        const L = 'Donaudampfschifffahrtsgesellschaftskapitaen';
        const set = (sel, t) => document.querySelectorAll(sel).forEach((e, i) => { if (i === 0) e.textContent = t; });
        set('main h1', L + ' ' + L); set('main .case-copy h2', L); set('main .ticks li', L + L); set('main .case-facts dd a', 'www.' + L.toLowerCase() + '-and-sons-roofing.com'); set('main .case-copy > p:not(.eyebrow)', L + L + ' ' + L); set('main .eyebrow', L + ' · ' + L);
        set('main .steps h2', L); set('main .steps dl dd', L); set('main .steps dl dt', L.slice(0, 22)); set('main .steps p', L + L + L); set('main .browser-bar span', 'www.' + L.toLowerCase() + '-and-sons-roofing.com'); set('main .stamp', L.slice(0, 24));
        set('main .lede', L + L);
      }); await p.waitForTimeout(200);
      const r = await p.evaluate(measure);
      console.log(`long words ${path} ${w}:`, JSON.stringify({ over: r.over, poke: r.poke.slice(0, 6), clipped: r.clipped.slice(0, 5), outside: r.outside.slice(0, 6) }));
      if (w === 390) await p.screenshot({ path: `zoom/${path.replace(/\//g, '')}_${w}_long.png`, fullPage: true });
      await ctx.close();
    }
  }
  await b.close();
})();
