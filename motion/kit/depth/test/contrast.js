// Contrast of every text on every card of the drum that is on screen, at rest on each step and on every frame of a turn,
// by day and by night, in the site's colours and the client band. The site's own tool reads painted pixels at rest; this one
// works from the styles, and counts what a card's own strength and the light behind it do:
// a card's paper is its lit plate (the surface colour at the plate's opacity) over the band, and the whole card may be fading out.
//   node test/contrast.js
const { engine, DEMO, open, jump, settle } = require('./lib');
const analyse = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[, /]+/).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mix = (t, p, a) => ({ r: t.r * a + p.r * (1 - a), g: t.g * a + p.g * (1 - a), b: t.b * a + p.b * (1 - a) });
  const solid = (e, stop) => { for (let n = e; n && n !== stop; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > .98) return c; } return null; };
  const res = [];
  document.querySelectorAll('.kws-cyl').forEach((el, ci) => {
    const track = el.querySelector('.kws-cyl-track'), tr = track.getBoundingClientRect(), band = solid(el) || { r: 255, g: 255, b: 255 };
    [...track.children].forEach((card, i) => {
      const a = parseFloat(card.style.opacity || 1), cr = card.getBoundingClientRect(), plate = getComputedStyle(card, '::after');
      if (a <= 0 || Math.min(cr.right, innerWidth, tr.right) - Math.max(cr.left, 0, tr.left) < 8 || tr.bottom < 0 || tr.top > innerHeight) return;
      const paper = mix(parse(plate.backgroundColor), band, +plate.opacity);
      const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.data.trim()) continue; const e = n.parentElement, cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || e.closest('[hidden]')) continue;
        const r = document.createRange(); r.selectNodeContents(n); const rr = r.getBoundingClientRect(); if (!rr.width || Math.min(rr.right, innerWidth) - Math.max(rr.left, 0) < 4) continue;
        const T = parse(cs.color), B = solid(e, card) || paper, fs = parseFloat(cs.fontSize), large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
        res.push({ cyl: ci, card: i + 1, a, plate: +plate.opacity, cls: (e.className || e.tagName).toString().slice(0, 24), text: n.data.trim().slice(0, 24), fs, ratio: +ratio(mix(T, band, a), mix(B, band, a)).toFixed(2), need: large ? 3 : 4.5 }); }
    });
  });
  return res;
};
const worst = rs => rs.reduce((m, r) => (r.ratio / r.need < m.ratio / m.need ? r : m), { ratio: 99, need: 1 });
(async () => {
  const b = await engine('chromium').launch(); let bad = 0, lowest = { ratio: 99, need: 1 };
  for (const dark of [false, true]) for (const w of [390, 820, 1280, 1920]) {
    const p = await open(b, DEMO, { w, h: 1000, dark });
    for (const [name, sel, k] of [['site', '#how .kws-cyl', 0], ['client band', '#client .kws-cyl', 1]]) {
      await jump(p, sel, -80); let n = 0, under = [], dims = new Set();
      for (let step = 0; step < 5; step++) { await p.evaluate(([s, i]) => document.querySelectorAll(s + ' .kws-cyl-dot')[i].click(), [sel, step]); await settle(p, sel); await p.waitForTimeout(260);
        const res = (await p.evaluate(analyse)).filter(r => r.cyl === k); n += res.length; under.push(...res.filter(r => r.ratio < r.need)); res.forEach(r => dims.add(r.a + '/' + r.plate)); const wst = worst(res); if (wst.ratio / wst.need < lowest.ratio / lowest.need) lowest = { ...wst, where: `${dark ? 'night' : 'day'} ${w}px ${name}` }; }
      if (under.length) bad++;
      console.log(`${under.length ? 'FAIL' : 'PASS'}  ${dark ? 'night' : 'day'} ${w}px, ${name}: at rest on each of the five steps, ${n} texts on cards in view, ${under.length} under AA${under.length ? ': ' + under.slice(0, 4).map(u => `${u.ratio}:1 "${u.text}" (${u.cls}, card at ${u.a}, plate ${u.plate})`).join('; ') : ''}  (card strength/light seen: ${[...dims].sort().join(' ')})`);
    }
    await p.ctx.close();
  }
  console.log(`      lowest ratio met at rest: ${lowest.ratio}:1 (needs ${lowest.need}) for "${lowest.text}" (${lowest.cls}, ${lowest.fs}px) ${lowest.where}`);
  // through a turn, every frame
  for (const dark of [false, true]) {
    const p = await open(b, DEMO, { w: 1440, h: 1000, dark }); await jump(p, '#how .kws-cyl', -80); await p.click('#how .kws-cyl-dot:nth-of-type(3)'); await settle(p); await p.waitForTimeout(300);
    await p.evaluate(`window.__an = ${analyse.toString()}`);
    const fr = await p.evaluate(() => new Promise(done => { const out = [], el = document.querySelector('#how .kws-cyl'); el.querySelector('.kws-cyl-nav:last-child').click(); let idle = 0;
      const loop = () => { const r = window.__an().filter(x => x.cyl === 0), full = r.filter(x => x.a === 1), fading = r.filter(x => x.a < 1); out.push({ underFull: full.filter(x => x.ratio < x.need).length, minFull: Math.min(...full.map(x => x.ratio / x.need)), fading: fading.length, n: r.length });
        if (!el.classList.contains('is-moving') && ++idle > 14) return done(out); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }));
    const under = Math.max(...fr.map(f => f.underFull)); if (under) bad++;
    console.log(`${under ? 'FAIL' : 'PASS'}  ${dark ? 'night' : 'day'} 1440px, one turn sampled on ${fr.length} frames (the light crossing from card to card included): texts under AA on any card at full strength: ${under}; a card leaving the drum fades for ${fr.filter(f => f.fading).length} of those frames`);
    await p.ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
