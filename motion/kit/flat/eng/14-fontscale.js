const { chromium, URL, settle, scrollToSel } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const who = () => { const vw = document.documentElement.clientWidth; const out = []; document.querySelectorAll('body *').forEach(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return; const r = e.getBoundingClientRect(); if (r.width && r.right > vw + .5) { let op = 1; for (let x = e; x && x !== document.body; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); out.push(`${(e.className && e.className.toString().split(' ')[0]) || e.tagName}[${Math.round(r.left)}..${Math.round(r.right)} op${op.toFixed(1)}]`); } }); return { sx: document.documentElement.scrollWidth - vw, who: [...new Set(out)].slice(0, 12) }; };
  for (const [label, W, css] of [['text spacing 390', 390, '*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}'], ['root 20px @360', 360, 'html{font-size:20px !important}'], ['root 20px @390', 390, 'html{font-size:20px !important}'], ['root 24px @360', 360, 'html{font-size:24px !important}'], ['root 24px @390', 390, 'html{font-size:24px !important}'], ['root 24px @430', 430, 'html{font-size:24px !important}'], ['root 32px @390', 390, 'html{font-size:32px !important}']]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.addStyleTag({ content: css }); await p.waitForTimeout(500);
    const r0 = await p.evaluate(who);
    // isolate: hide kit components and re-measure (is the overflow the kit's or the page's?)
    const r1 = await p.evaluate(() => { document.querySelectorAll('.kws-arc,.kws-spot').forEach(e => e.style.display = 'none'); const vw = document.documentElement.clientWidth; const sx = document.documentElement.scrollWidth - vw; document.querySelectorAll('.kws-arc,.kws-spot').forEach(e => e.style.display = ''); return sx; });
    console.log(`${label}: page sideways scroll ${r0.sx}px (with the kit hidden: ${r1}px)  offenders: ${r0.who.join(' ')}`);
    if (/24px @390|32px/.test(label)) { await scrollToSel(p, '#services .kws-arc', 20); await p.waitForTimeout(200); await p.screenshot({ path: `fontscale-${label.replace(/[^a-z0-9]+/gi, '-')}.png` }); }
    await ctx.close();
  }
  await b.close();
})();
