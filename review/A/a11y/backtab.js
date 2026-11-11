const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const w of [390, 1280]) for (const path of ['/', '/pricing/', '/consulting/', '/contact/', '/services/', '/faq/']) { const ctx = await ctxFor(b, { w, h: w === 390 ? 844 : 800, reduced: true, mobile: w === 390 }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    await p.evaluate(() => { const a = [...document.querySelectorAll('footer a')].pop(); a.focus(); }); await p.waitForTimeout(300);
    let n = 0, cov = [], jumps = [];
    for (let i = 0; i < 120; i++) { const y0 = await p.evaluate(() => scrollY); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(90);
      const s = await p.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; const r = el.getBoundingClientRect(); let c = 0, t = 0; const by = {}; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { t++; const x = r.left + r.width * (i + .5) / 7, y = r.top + r.height * (j + .5) / 3; if (y < 0 || y >= innerHeight) { c++; by.off = 1; continue; } const h = document.elementFromPoint(x, y); const fx = h && h.closest('.site-header,.mobile-cta'); if (fx && !fx.contains(el)) { c++; by[fx.className.split(' ')[0]] = 1; } } return { c, t, by: Object.keys(by).join('+'), text: (el.textContent || '').trim().slice(0, 25), inHeader: !!el.closest('.site-header,.topbar,.skip-link'), top: Math.round(r.top), sy: Math.round(scrollY) }; });
      if (!s) break; n++; if (s.c) cov.push(`"${s.text}" ${s.c}/${s.t} ${s.by} top=${s.top}`); if (s.inHeader) { jumps.push(`"${s.text}" scrollY ${Math.round(y0)} -> ${s.sy}`); if (jumps.length > 3) break; } }
    console.log(`${path} @${w}: back-tab stops=${n} covered=${cov.length} ${cov.slice(0, 4).join(' | ')}\n      entering header: ${jumps.join(' ; ')}`);
    await ctx.close(); }
  await b.close(); })();
