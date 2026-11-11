// Tap on a side card, with touch (tablet 820 and phone 390) versus mouse. Also: which request 404s on the demo page.
const { chromium, DEMO, log, ok, open, jump, cur, settle } = require('./lib');
const CYL = '#how .kws-cyl';
(async () => {
  const b = await chromium.launch();
  for (const mode of ['mouse', 'touch']) for (const w of [820, 390]) {
    const p = await open(b, DEMO, { w, h: 1000, touch: mode === 'touch' });
    const bad = []; p.on('response', r => { if (r.status() >= 400) bad.push(r.url()); });
    const cdp = await p.ctx.newCDPSession(p);
    await jump(p, CYL, -60); await p.waitForTimeout(300);
    await p.evaluate(s => { document.querySelectorAll(s + ' .kws-cyl-card').forEach((li, i) => { const a = document.createElement('a'); a.href = '#step-' + (i + 1); a.textContent = 'Read about step ' + (i + 1); a.className = 'x-link'; a.style.cssText = 'display:block;padding:14px 0'; li.append(a); }); }, CYL);
    await p.waitForTimeout(300);
    const order = await p.evaluate(() => { window.__ev = []; const tr = document.querySelector('.kws-cyl-track'); ['pointerdown', 'pointerup', 'click'].forEach(t => tr.addEventListener(t, e => window.__ev.push(t + '@' + Math.round(performance.now())), true)); const st = window.setTimeout; window.setTimeout = (f, ms, ...a) => st(() => { window.__ev.push('timer(' + (ms || 0) + ')@' + Math.round(performance.now())); f(...a); }, ms); });
    const tap = async (x, y) => { if (mode === 'touch') { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await p.waitForTimeout(50); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); } else await p.mouse.click(x, y); };
    // 1. tap the body of the right-hand side card (not a link)
    let r = await p.evaluate(s => { const c = document.querySelectorAll(s + ' .kws-cyl-card')[1].getBoundingClientRect(); return { l: c.left, t: c.top, r: c.right, b: c.bottom }; }, CYL);
    let x = Math.min(innerW(w) - 6, r.l + 30), y = r.t + 40;
    function innerW(w) { return w; }
    let hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.closest('.kws-cyl-card') ? 'card ' + [...e.closest('.kws-cyl-track').children].indexOf(e.closest('.kws-cyl-card')) : e.className) : 'none'; }, [x, y]);
    await tap(x, y); await p.waitForTimeout(1400);
    const on1 = await cur(p, CYL), ev1 = await p.evaluate(() => window.__ev.splice(0).join(' '));
    ok(on1 === 1, `${mode} ${w}px: a tap on the side card (hit: ${hit}) brings it to the middle`, `now step ${on1}; events: ${ev1}`);
    // 2. tap the link on the (new) right-hand side card
    await p.evaluate(s => document.querySelectorAll(s + ' .kws-cyl-dot')[0].click(), CYL); await settle(p, CYL); await p.waitForTimeout(100);
    r = await p.evaluate(s => { const c = document.querySelectorAll(s + ' .kws-cyl-card')[1].querySelector('.x-link').getBoundingClientRect(); return { l: c.left, t: c.top, r: c.right, b: c.bottom }; }, CYL);
    x = Math.min(w - 6, r.l + 12); y = (r.t + r.b) / 2;
    hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + '.' + e.className : 'none'; }, [x, y]);
    await p.evaluate(() => window.__ev.splice(0));
    await tap(x, y); await p.waitForTimeout(1400);
    const on2 = await cur(p, CYL), hash = await p.evaluate(() => location.hash), ev2 = await p.evaluate(() => window.__ev.splice(0).join(' '));
    ok(hash === '' && on2 === 1, `${mode} ${w}px: a tap on a link on the side card (hit: ${hit}) brings the card round and does not follow the link`, `step ${on2}; hash "${hash}"; events: ${ev2}`);
    if (bad.length) log('   failed requests: ' + bad.join(', '));
    await p.ctx.close();
  }
  const p = await open(b, DEMO, { w: 1280, wait: 0 }); const bad = [];
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); }); await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(500);
  log('failed requests on demo.html: ' + (bad.join(', ') || 'none') + ' ; console errors: ' + (p.errs.join(' | ') || 'none'));
  await b.close();
})();
