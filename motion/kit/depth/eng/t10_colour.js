// Colour rule: nothing inside a mock is blue; blue only on pressable things; no gold on paper.
const { chromium, DEMO, log, ok, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const dark of [false, true]) {
    const p = await open(b, DEMO, { w: 1280, h: 900, dark });
    const r = await p.evaluate(() => { const probe = document.createElement('i'); document.querySelector('#how').append(probe); const tok = {}; for (const t of ['--blue', '--blue-deep', '--blue-tint', '--board', '--focus', '--gold']) { probe.style.color = `var(${t})`; tok[t] = getComputedStyle(probe).color; } probe.remove();
      const blues = [tok['--blue'], tok['--blue-deep'], tok['--blue-tint'], tok['--board']]; const hits = [], gold = [], blueOutside = [];
      document.querySelectorAll('#how .kws-cyl *, #included .kws-ring *').forEach(e => { const cs = getComputedStyle(e), bf = getComputedStyle(e, '::before'), af = getComputedStyle(e, '::after'); const cols = [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderBottomColor, cs.outlineColor, cs.fill, cs.stroke, bf.backgroundColor, bf.borderTopColor, af.backgroundColor]; const press = e.closest('a,button');
        if (cols.some(c => blues.includes(c))) { if (e.closest('.kws-cyl-art')) hits.push(e.className || e.tagName); else if (!press) { const which = ['color', 'background', 'border-top', 'border-bottom', 'outline', 'fill', 'stroke', '::before bg', '::before border', '::after bg'].filter((k, i) => blues.includes(cols[i])); const real = which.filter(k => !(k === 'outline' && cs.outlineStyle === 'none') && !(k.startsWith('border') && parseFloat(k === 'border-top' ? cs.borderTopWidth : cs.borderBottomWidth) === 0) && !(k === 'fill' || k === 'stroke') ); if (real.length) blueOutside.push((e.className || e.tagName) + ':' + real.join('/')); } }
        if (cols.slice(0, 4).includes(tok['--gold']) && !(dark && false)) gold.push(e.className || e.tagName); });
      return { tok, hits: [...new Set(hits)], blueOutside: [...new Set(blueOutside)].slice(0, 8), gold: [...new Set(gold)].slice(0, 5) }; });
    ok(r.hits.length === 0 && r.blueOutside.length === 0 && r.gold.length === 0, `${dark ? 'night' : 'day'}: no blue inside a mock, no blue on anything that is not pressable, no gold on paper`, JSON.stringify({ inMock: r.hits, notPressable: r.blueOutside, gold: r.gold }));
    await p.ctx.close();
  }
  await b.close();
})();
