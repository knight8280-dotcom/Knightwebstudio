// html[data-motion="off"] present in the markup before first paint, with and without a site rule that stops animations when paused.
const { chromium, DEMO, log, ok } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const rule of [false, true]) for (const w of [390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 3000 } });
    let release; const gate = new Promise(r => release = r);
    await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await gate; r.continue(); });
    await ctx.route(/demo\.html/, async r => { const res = await r.fetch(); let body = await res.text(); body = body.replace('<html lang="en">', '<html lang="en" data-motion="off">'); if (rule) body = body.replace('</head>', '<style>[data-motion=off] *,[data-motion=off] *::before,[data-motion=off] *::after{animation:none !important;transition:none !important}</style></head>'); r.fulfill({ response: res, body }); });
    await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await ctx.newPage(); p.goto(DEMO, { waitUntil: 'commit' }).catch(() => {}); await p.waitForTimeout(900);
    const m = () => p.evaluate(() => ({ motion: document.documentElement.dataset.motion, live: document.querySelectorAll('.is-live').length, cyl: Math.round(document.querySelector('.kws-cyl').getBoundingClientRect().height), doc: document.documentElement.scrollHeight, cls: +window.__cls.toFixed(4) }));
    const held = await m(); release(); await p.waitForTimeout(1500); const live = await m();
    ok(held.cyl === live.cyl && live.cls < 0.001, `data-motion=off in the markup${rule ? ' + a pause rule that stops CSS animations (as the site reduced-motion rule does)' : ''}, ${w}px: space held`, `held ${JSON.stringify(held)} > live ${JSON.stringify(live)}`);
    await ctx.close();
  }
  await b.close();
})();
