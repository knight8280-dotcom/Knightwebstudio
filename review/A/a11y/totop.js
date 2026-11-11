const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch();
  for (const [base, label] of [[BASE, 'new'], ['http://localhost:8700', 'baseline']]) for (const path of ['/pricing/', '/']) { const ctx = await ctxFor(b, { w: 1280, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(300);
    const has = await p.locator('a[href="#top"]').count(); if (!has) { console.log(label, path, 'no #top link'); await ctx.close(); continue; }
    await p.locator('a[href="#top"]').focus(); await p.waitForTimeout(200); const y0 = await p.evaluate(() => Math.round(scrollY)); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    const st = await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); return { scrollY: Math.round(scrollY), active: e.tagName + ' ' + (e.textContent || '').trim().slice(0, 20), activeTop: Math.round(r.top), onScreen: r.top < innerHeight && r.bottom > 0 }; });
    await p.keyboard.press('Tab'); await p.waitForTimeout(200); const next = await p.evaluate(() => { const e = document.activeElement; return e.tagName + ' ' + (e.textContent || '').trim().slice(0, 25) + ' scrollY=' + Math.round(scrollY); });
    console.log(label, path, 'before', y0, JSON.stringify(st), 'next Tab ->', next); await ctx.close(); }
  await b.close(); })();
