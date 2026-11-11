// 320..1920 in 20px steps: no sideways page scroll, no visible kit element past the window edge; settled, each item centred (sampled), and mid-drag.
const { chromium, URL } = require('./lib');
(async () => {
  const b = await chromium.launch(); const bad = []; let checks = 0;
  const ctx = await b.newContext({ viewport: { width: 320, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const probe = () => p.evaluate(() => { const vw = document.documentElement.clientWidth; const out = { sx: document.documentElement.scrollWidth - vw, over: [] };
    document.querySelectorAll('.kws-arc *, .kws-spot *').forEach(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return; let op = 1; for (let x = e; x && x !== document.body; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); if (op < 0.02) return; if (e.className && /-sr$/.test(e.className)) return; const r = e.getBoundingClientRect(); if (!r.width) return; if (r.right > vw + 0.5 || r.left < -0.5) out.over.push(`${e.className || e.tagName}:${Math.round(r.left)}..${Math.round(r.right)}`); });
    // overlap of caption content with the control row, and of the centred picture with the caption heading
    out.overlap = [...document.querySelectorAll('.kws-arc,.kws-spot')].map(el => { const on = el.querySelector('li.is-on'); if (!on) return 0; const ctl = el.querySelector('[role=group]'); if (!ctl || !ctl.isConnected) return 0; const last = on.querySelector('a').getBoundingClientRect(); return Math.round(ctl.getBoundingClientRect().top - last.bottom); });
    out.sr = [...document.querySelectorAll('[aria-live]')].map(e => { const r = e.getBoundingClientRect(); return Math.round(r.right - vw); }).filter(v => v > 0);
    return out; });
  for (let w = 320; w <= 1920; w += 20) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(120);
    for (const step of [0, 1, 4]) {
      if (step) await p.evaluate(n => document.querySelectorAll('.kws-arc,.kws-spot').forEach(el => { const d = el.querySelectorAll('[class$=-dot]'); d[n % d.length].click(); }), step);
      const r = await probe(); checks++;
      if (r.sx > 0 || r.over.length || r.sr.length || r.overlap.some(v => v < 0)) bad.push([w, step, r.sx, r.over.slice(0, 4), r.sr, r.overlap]);
    }
    await p.evaluate(() => document.querySelectorAll('.kws-arc,.kws-spot').forEach(el => el.querySelector('[class$=-dot]').click()));
  }
  console.log(`settled: ${checks} checks from 320 to 1920; problems: ${bad.length}`); bad.slice(0, 30).forEach(x => console.log('  ', JSON.stringify(x)));
  await ctx.close();
  // mid-drag (no reduced motion): hold a drag at -0.5 step and at +1.3 steps and probe
  const ctx2 = await b.newContext({ viewport: { width: 360, height: 800 } }); const q = await ctx2.newPage(); await q.goto(URL, { waitUntil: 'load' }); await q.waitForTimeout(500); const bad2 = []; let c2 = 0;
  for (let w = 320; w <= 1920; w += 40) { await q.setViewportSize({ width: w, height: 800 }); await q.waitForTimeout(100);
    for (const sel of ['#services .kws-arc', '#work .kws-spot']) { await q.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 120); }, sel); await q.waitForTimeout(60);
      const lb = await q.locator(sel + ' ul').boundingBox(); const x = lb.x + lb.width / 2, y = lb.y + 60;
      for (const dx of [-0.33, 0.45]) { await q.mouse.move(x, y); await q.mouse.down(); for (let i = 1; i <= 6; i++) await q.mouse.move(x + dx * lb.width * i / 6, y); await q.waitForTimeout(50);
        const r = await q.evaluate(() => { const vw = document.documentElement.clientWidth; const over = []; document.querySelectorAll('.kws-arc-tile,.kws-spot-frame').forEach(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity < 0.02) return; const r = e.getBoundingClientRect(); if (r.right > vw + 0.5 || r.left < -0.5) over.push(`${e.className}:${Math.round(r.left)}..${Math.round(r.right)} op ${cs.opacity}`); }); return { sx: document.documentElement.scrollWidth - vw, over }; });
        c2++; if (r.sx > 0 || r.over.length) bad2.push([w, sel, dx, r.sx, r.over.slice(0, 3)]); await q.mouse.up(); await q.waitForTimeout(700); } } }
  console.log(`mid-drag: ${c2} checks; problems: ${bad2.length}`); bad2.slice(0, 20).forEach(x => console.log('  ', JSON.stringify(x)));
  await b.close();
})();
