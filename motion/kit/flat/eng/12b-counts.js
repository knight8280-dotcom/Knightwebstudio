const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
(async () => {
  const b = await chromium.launch();
  for (const W of [360, 390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const remount = (sel, kind, fnBody, arg, opts) => p.evaluate(([sel, kind, fnBody, arg, opts]) => { const el = document.querySelector(sel); const off = KWS[kind].mount(el); off(); (new Function('el', 'arg', fnBody))(el, arg); KWS[kind].mount(el, opts || {}); }, [sel, kind, fnBody, arg, opts]);
    for (const [kind, sel, n, opts] of [['arc', '.demo-client .kws-arc', 1], ['arc', '.demo-client .kws-arc', 2], ['arc', '.demo-client .kws-arc', 3], ['arc', '.demo-client .kws-arc', 4], ['arc', '.demo-client .kws-arc', 30], ['arc', '.demo-client .kws-arc', 9, { loop: false }], ['spotlight', '.demo-client .kws-spot', 1], ['spotlight', '.demo-client .kws-spot', 2], ['spotlight', '.demo-client .kws-spot', 4], ['spotlight', '.demo-client .kws-spot', 12], ['spotlight', '.demo-client .kws-spot', 5, { loop: false }]]) {
      await remount(sel, kind, `const ul = el.querySelector('ul'); if (!window['__proto' + el.className]) window['__proto' + el.className] = [...ul.children].map(li => li.cloneNode(true)); const proto = window['__proto' + el.className]; ul.innerHTML = ''; for (let i = 0; i < arg; i++) { const li = proto[i % proto.length].cloneNode(true); li.querySelector('h2,h3,h4').textContent += ' ' + (i + 1); ul.append(li); }`, n, opts);
      await scrollToSel(p, sel, 80); await p.waitForTimeout(250); const s0 = await state(p, sel);
      const g = await p.evaluate(s => { const el = document.querySelector(s); const vw = document.documentElement.clientWidth; const over = []; el.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden') return; let op = 1; for (let x = e; x && x !== document.body; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); if (op < .02 || /-sr$/.test(e.className)) return; const r = e.getBoundingClientRect(); if (r.width && (r.right > vw + .5 || r.left < -.5)) over.push((e.className || e.tagName) + ':' + Math.round(r.left) + '..' + Math.round(r.right)); });
        const ctl = el.querySelector('[role=group]'); const cr = ctl && ctl.isConnected ? ctl.getBoundingClientRect() : null; return { sx: document.documentElement.scrollWidth - vw, over: over.slice(0, 4), ctl: cr ? el.querySelectorAll('[role=group] button').length : 0, ctlH: cr ? Math.round(cr.height) : 0, ctlRows: cr ? new Set([...ctl.children].map(c => Math.round(c.getBoundingClientRect().top))).size : 0, h: Math.round(el.getBoundingClientRect().height) }; }, sel);
      const seq = []; for (let i = 0; i < Math.min(n + 1, 5) && g.ctl; i++) { await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Next"]').click(), sel); await settle(p, sel); seq.push((await state(p, sel)).on); }
      const back = []; for (let i = 0; i < 2 && g.ctl; i++) { await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Previous"]').click(), sel); await settle(p, sel); back.push((await state(p, sel)).on); }
      const vis = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-arc-tile,' + s + ' .kws-spot-frame')].filter(e => getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.02).length, sel);
      await p.screenshot({ path: `count-${kind}-${n}${opts ? '-noloop' : ''}-${W}.png` });
      log(g.sx <= 0 && g.over.length === 0 && s0.nOn === 1, `${W}: ${kind} with ${n} item(s)${opts ? ' loop:false' : ''}`, { controls: g.ctl, controlRows: g.ctlRows, controlRowH: g.ctlH, visiblePictures: vis, next: seq, prev: back, h: g.h, over: g.over, sx: g.sx });
    }
    log(errs.length === 0, `${W}: no console errors`, errs.join(';'));
    await ctx.close();
  }
  await b.close();
})();
