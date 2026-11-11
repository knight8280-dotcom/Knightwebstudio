const { chromium, BASE, ctxFor } = require('./lib');
const FIX = `@media (max-height: 480px){ .site-header{position:static} .mobile-cta,.mobile-cta.show{display:none} html{scroll-padding:var(--s-5) 0} }`;
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[341, 162], [320, 256], [844, 340], [390, 844]]) { const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.addStyleTag({ content: FIX }); await p.waitForTimeout(300); await p.evaluate(() => scrollTo(0, 2400)); await p.waitForTimeout(500);
    const m = await p.evaluate(() => { let covered = 0; for (let y = 2; y < innerHeight; y += 4) { const t = document.elementFromPoint(innerWidth / 2, y); if (t && t.closest('.site-header,.mobile-cta,.topbar')) covered += 4; } return { covered, vh: innerHeight }; });
    // focus cover check with the fix
    const cov = await p.evaluate(async () => { const els = [...document.querySelectorAll('main a[href], main button, main summary')].filter(e => e.checkVisibility({ checkVisibilityCSS: true })).slice(0, 30); let bad = 0; for (const el of els) { el.focus(); await new Promise(r => setTimeout(r, 120)); const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2))); if (!t || !(el.contains(t) || t.contains(el))) bad++; } return bad + '/' + els.length; });
    console.log(`${w}x${h} with fix: sticky chrome covers ${m.covered}px of ${m.vh}px; focused controls hidden: ${cov}`); await ctx.close(); }
  await b.close(); })();
