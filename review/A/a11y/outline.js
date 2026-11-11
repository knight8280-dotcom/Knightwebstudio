// Heading outline in DOM order (only headings exposed to AT), with skips flagged.
const { chromium, BASE, PAGES, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1280]) for (const path of PAGES) {
    const ctx = await ctxFor(b, { w, h: 800, reduced: true, mobile: w === 390 });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const hidden = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.getAttribute('aria-hidden') === 'true' || e.hidden) return true; } return false; };
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map(h => ({ l: +(h.getAttribute('aria-level') || h.tagName[1]), t: h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), hid: hidden(h), cls: h.className }));
      return hs;
    });
    const vis = r.filter(h => !h.hid);
    let prev = 0; const out = []; const skips = [];
    for (const h of vis) { if (h.l > prev + 1) skips.push(`${prev}->${h.l} "${h.t}"`); prev = h.l; out.push('  '.repeat(h.l - 1) + 'h' + h.l + ' ' + h.t + (h.cls ? '  .' + h.cls : '')); }
    console.log(`\n=== ${path} @${w}  h1=${vis.filter(h => h.l === 1).length} hiddenHeads=${r.filter(h => h.hid).length} ${skips.length ? 'SKIPS: ' + skips.join(' ; ') : ''}`);
    if (w === 390) console.log(out.join('\n'));
    if (r.filter(h => h.hid).length) console.log('  hidden: ' + r.filter(h => h.hid).map(h => 'h' + h.l + ' ' + h.t).join(' | '));
    await ctx.close();
  }
  await b.close();
})();
