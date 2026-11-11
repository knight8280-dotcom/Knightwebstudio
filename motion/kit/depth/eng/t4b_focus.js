const { chromium, DEMO, log, ok, open, jump, cur, settle } = require('./lib');
const CYL = '#how .kws-cyl';
(async () => {
  const b = await chromium.launch();
  for (const w of [1280, 390]) {
    const p = await open(b, DEMO, { w, h: 900 });
    await p.evaluate(s => { document.querySelectorAll(s + ' .kws-cyl-card').forEach((li, i) => { const a = document.createElement('a'); a.href = '#step-' + (i + 1); a.textContent = 'Read about step ' + (i + 1); a.className = 'x-link'; li.append(a); }); }, CYL);
    await jump(p, CYL, -100); await p.waitForTimeout(200);
    await p.evaluate(() => { const a = document.querySelector('#how .section-head'); a.tabIndex = -1; a.focus(); });
    const rows = [];
    for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(1000); rows.push(await p.evaluate(s => { const a = document.activeElement, el = document.querySelector(s), r = a.getBoundingClientRect(), card = a.closest('.kws-cyl-card'); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { t: a.textContent, centred: card.classList.contains('is-on'), op: card.style.opacity, inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, notCovered: top === a, scrollY: Math.round(scrollY) }; }, CYL)); }
    ok(rows.every(r => r.centred && r.op === '1' && r.inView && r.notCovered), `${w}px: tabbing through five card links: each card comes to the middle, opaque, link in view and not covered`, JSON.stringify(rows.map(r => [r.centred, r.op, r.inView, r.notCovered, r.top, r.bottom])));
    // focus then arrow: where is the focus?
    for (const presses of [1, 2]) {
      await p.evaluate(s => document.querySelectorAll(s + ' .kws-cyl-dot')[0].click(), CYL); await settle(p, CYL);
      await p.focus(CYL + ' .kws-cyl-card.is-on .x-link'); for (let i = 0; i < presses; i++) await p.keyboard.press('ArrowRight'); await settle(p, CYL); await p.waitForTimeout(150);
      const f = await p.evaluate(s => { const a = document.activeElement, r = a.getBoundingClientRect(), card = a.closest('.kws-cyl-card'), tr = document.querySelector(s + ' .kws-cyl-track').getBoundingClientRect(); const visW = Math.max(0, Math.min(r.right, innerWidth, tr.right) - Math.max(r.left, 0, tr.left)); return { focus: a.textContent, visiblePx: Math.round(visW), ofPx: Math.round(r.width), x: Math.round(r.left), cardOpacity: card.style.opacity, centre: [...document.querySelector(s).querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')) + 1 }; }, CYL);
      ok(f.visiblePx >= f.ofPx - 1 && +f.cardOpacity === 1, `${w}px: ArrowRight x${presses} with focus on the link in card 1: the focused element stays fully visible on a full-strength card`, JSON.stringify(f));
      if (w === 390 && presses === 1) await p.screenshot({ path: 'shots/focus-carried-off-390.png' });
    }
    await p.ctx.close();
  }
  await b.close();
})();
