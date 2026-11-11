// 4b. Contrast of every text node on every card of the drum, at rest and through a turn (>= 20 frames), both themes and the client band.
// Opacity is applied to the whole card, so text T on its own background B, shown at strength a over the band colour P, is
// contrast(a*T + (1-a)*P, a*B + (1-a)*P). Checked against pixels at the end.
const { chromium, DEMO, log, ok, open, jump, settle } = require('./lib');
const analyse = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[, /]+/).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mix = (t, p, a) => ({ r: t.r * a + p.r * (1 - a), g: t.g * a + p.g * (1 - a), b: t.b * a + p.b * (1 - a) });
  const bgOf = (e, stop) => { for (let n = e; n && n !== stop; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > .98) return c; } return null; };
  const pageBg = e => { for (let n = e; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > .98) return c; } return { r: 255, g: 255, b: 255 }; };
  const res = [];
  document.querySelectorAll('.kws-cyl').forEach((el, ci) => {
    const track = el.querySelector('.kws-cyl-track'), tr = track.getBoundingClientRect(), P = pageBg(el);
    [...track.children].forEach((card, i) => {
      const a = parseFloat(card.style.opacity || 1), cr = card.getBoundingClientRect();
      const visW = Math.max(0, Math.min(cr.right, innerWidth, tr.right) - Math.max(cr.left, 0, tr.left));
      if (a <= 0 || visW < 8 || tr.bottom < 0 || tr.top > innerHeight) return;
      const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.data.trim()) continue; const e = n.parentElement, cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = document.createRange(); r.selectNodeContents(n); const rr = r.getBoundingClientRect(); if (Math.min(rr.right, innerWidth) - Math.max(rr.left, 0) < 4) continue;   // this text is not on screen
        const T = parse(cs.color), B = bgOf(e, card.parentElement) || P; const fs = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = fs >= 24 || (fs >= 18.66 && bold);
        const own = +getComputedStyle(e).opacity; const c = ratio(mix(T, P, a), mix(B, P, a));
        res.push({ cyl: ci, card: i + 1, a, cls: (e.className || e.tagName).toString().slice(0, 26), text: n.data.trim().slice(0, 26), fs, large, ratio: +c.toFixed(2), need: large ? 3 : 4.5, x: Math.round(rr.left), y: Math.round(rr.top), w: Math.round(rr.width), h: Math.round(rr.height) }); }
    });
  });
  return res;
};
(async () => {
  const b = await chromium.launch();
  const worstAll = [];
  for (const dark of [false, true]) for (const w of [390, 820, 1280, 1440, 1920]) {
    const p = await open(b, DEMO, { w, h: 1000, dark });
    if (await p.evaluate(() => document.documentElement.getAttribute('data-theme')) !== (dark ? 'dark' : 'light')) log('theme mismatch');
    for (const [name, sel] of [['site', '#how .kws-cyl'], ['client', '#client .kws-cyl']]) {
      await jump(p, sel, -80); await p.waitForTimeout(250);
      const res = (await p.evaluate(analyse)).filter(r => r.cyl === (name === 'site' ? 0 : 1));
      const tiers = {}; res.forEach(r => { const k = r.a.toFixed(2); (tiers[k] = tiers[k] || []).push(r); });
      const line = Object.keys(tiers).sort().reverse().map(k => { const t = tiers[k], fails = t.filter(r => r.ratio < r.need), wst = t.reduce((m, r) => (r.ratio / r.need < m.ratio / m.need ? r : m)); return `strength ${k}: ${t.length} texts, ${fails.length} under AA, worst ${wst.ratio}:1 (${wst.cls} "${wst.text}", ${wst.fs}px)`; }).join(' | ');
      const fails = res.filter(r => r.ratio < r.need);
      ok(fails.length === 0, `${dark ? 'night' : 'day'} ${w}px ${name} drum at rest`, line);
      fails.forEach(f => worstAll.push({ theme: dark ? 'night' : 'day', w, name, ...f }));
      if (w === 1440 && name === 'site') await p.screenshot({ path: `shots/contrast-${dark ? 'night' : 'day'}-1440-rest.png`, clip: { x: 0, y: 40, width: 1440, height: 640 } });
      if (w === 1920 && name === 'site') await p.screenshot({ path: `shots/contrast-${dark ? 'night' : 'day'}-1920-rest.png`, clip: { x: 0, y: 40, width: 1920, height: 640 } });
    }
    await p.ctx.close();
  }
  const byText = {}; worstAll.forEach(f => { const k = `${f.theme} ${f.name} a=${f.a} ${f.cls}`; if (!byText[k] || f.ratio < byText[k].ratio) byText[k] = f; });
  log('\nUnder-AA texts at rest (worst per kind; widths where seen):');
  Object.entries(byText).sort((a, b) => a[1].ratio - b[1].ratio).slice(0, 40).forEach(([k, f]) => log(`  ${f.ratio}:1 (needs ${f.need})  ${k}  "${f.text}" ${f.fs}px  widths: ${[...new Set(worstAll.filter(x => `${x.theme} ${x.name} a=${x.a} ${x.cls}` === k).map(x => x.w))].join(',')}`));

  // ---- through a turn: sample every frame
  for (const dark of [false, true]) {
    const p = await open(b, DEMO, { w: 1440, h: 1000, dark });
    await jump(p, '#how .kws-cyl', -80); await p.waitForTimeout(300);
    await p.evaluate(`window.__an = ${analyse.toString()}`);
    const frames = await p.evaluate(() => new Promise(done => { const out = []; const el = document.querySelector('#how .kws-cyl'); el.querySelector('.kws-cyl-nav:last-child').click(); let idle = 0; const loop = () => { const r = window.__an().filter(x => x.cyl === 0); const onCard = [...el.querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')) + 1; out.push({ on: onCard, min: r.reduce((m, x) => (x.ratio / x.need < m.ratio / m.need ? x : m)), minOn: r.filter(x => x.card === onCard).reduce((m, x) => (x.ratio / x.need < m.ratio / m.need ? x : m), { ratio: 99, need: 1 }), under: r.filter(x => x.ratio < x.need).length, n: r.length }); if (!el.classList.contains('is-moving') && ++idle > 2) return done(out); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }));
    const wOn = frames.reduce((m, f) => (f.minOn.ratio / f.minOn.need < m.minOn.ratio / m.minOn.need ? f : m)), wAny = frames.reduce((m, f) => (f.min.ratio / f.min.need < m.min.ratio / m.min.need ? f : m));
    log(`\n${dark ? 'night' : 'day'} 1440px, one Next turn sampled on ${frames.length} frames: worst text on the card in focus ${wOn.minOn.ratio}:1 (${wOn.minOn.cls} "${wOn.minOn.text}", needs ${wOn.minOn.need}); worst on any visible card ${wAny.min.ratio}:1 (card ${wAny.min.card} at strength ${wAny.min.a}, ${wAny.min.cls}); texts under AA per frame: min ${Math.min(...frames.map(f => f.under))}, max ${Math.max(...frames.map(f => f.under))} of about ${frames[0].n}`);
    await p.ctx.close();
  }
  await b.close();
})();
