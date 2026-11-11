// OB-07: how much of a landscape phone screen do the sticky header and the phone bar take? new vs live
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE || 'webkit'];
(async () => {
  const b = await eng.launch();
  for (const [base, tag] of [['http://localhost:8720', 'new'], ['http://localhost:8700', 'live']]) {
    for (const [w, h] of [[844, 390], [667, 375], [932, 430]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true });
      await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
      const p = await ctx.newPage(); await p.goto(base + '/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(400);
      await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let i = 0; i < 12; i++) { window.scrollBy(0, 150); await new Promise(r => setTimeout(r, 60)); } }); await p.waitForTimeout(900);
      const r = await p.evaluate(() => { const q = s => document.querySelector(s); const hd = q('#site-header') || q('.site-header'); const bar = q('#mobile-cta'); const hr = hd.getBoundingClientRect(); const br = bar ? bar.getBoundingClientRect() : null; const bs = bar ? getComputedStyle(bar) : null; const barVisible = !!bar && bs.display !== 'none' && bs.visibility !== 'hidden' && br.top < innerHeight - 1; return { headerPos: getComputedStyle(hd).position, headerTop: Math.round(hr.top), headerH: Math.round(hr.height), headerVisible: hr.bottom > 0, barVisible, barH: br ? Math.round(br.height) : 0, barTop: br ? Math.round(br.top) : null, ih: innerHeight }; });
      const covered = (r.headerVisible ? r.headerH + Math.max(0, r.headerTop) : 0) + (r.barVisible ? r.ih - r.barTop : 0);
      console.log(`  ${tag} ${w}x${h}: header ${r.headerPos} ${r.headerVisible ? r.headerH + 'px' : 'off-screen'}, bar ${r.barVisible ? (r.ih - r.barTop) + 'px' : 'hidden'}, covered ${covered}px of ${r.ih} (${Math.round(100 * covered / r.ih)}%), free ${r.ih - covered}px`);
      if (w === 844) await p.screenshot({ path: `shots/land_${tag}_${w}x${h}.png` });
      await ctx.close();
    }
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
