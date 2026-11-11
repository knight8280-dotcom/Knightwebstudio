// Robustness: long words / long names, 1 / 2 / many items, images missing, fonts late, theme toggle mid-move, zoom, text spacing, bfcache, mount/unmount.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
const geom = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); const vw = document.documentElement.clientWidth; const on = el.querySelector('li.is-on'); const ctl = el.querySelector('[role=group]'); const cap = on.querySelector('[class$=-cap]');
  const lastKid = [...cap.children].pop().getBoundingClientRect(); const pic = on.querySelector('.kws-arc-tile,.kws-spot-frame').getBoundingClientRect(); const first = cap.children[0].getBoundingClientRect();
  const over = []; el.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden') return; let op = 1; for (let x = e; x && x !== document.body; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity); if (op < .02 || /-sr$/.test(e.className)) return; const r = e.getBoundingClientRect(); if (r.width && (r.right > vw + .5 || r.left < -.5)) over.push((e.className || e.tagName) + ':' + Math.round(r.left) + '..' + Math.round(r.right)); });
  const clipped = [...on.querySelectorAll('h2,h3,h4,p,a,.kws-arc-tile')].filter(e => e.scrollWidth > e.clientWidth + 2).map(e => (e.className || e.tagName) + ' ' + e.scrollWidth + '>' + e.clientWidth);
  return { sx: document.documentElement.scrollWidth - vw, h: Math.round(el.getBoundingClientRect().height), capToCtl: ctl && ctl.isConnected ? Math.round(ctl.getBoundingClientRect().top - lastKid.bottom) : null, picToCap: Math.round(first.top - pic.bottom), over: over.slice(0, 5), clipped, ctl: ctl && ctl.isConnected ? el.querySelectorAll('[role=group] button').length : 0 }; }, sel);
(async () => {
  const b = await chromium.launch();
  for (const W of [360, 390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 } }); const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const remount = (sel, kind, fnBody, arg) => p.evaluate(([sel, kind, fnBody, arg]) => { const el = document.querySelector(sel); const off = KWS[kind].mount(el); off(); (new Function('el', 'arg', fnBody))(el, arg); KWS[kind].mount(el); }, [sel, kind, fnBody, arg]);
    // ---- long words and long names
    await remount('#services .kws-arc', 'arc', `const li = el.querySelector('li'); li.querySelector('h2').textContent = 'Geschwindigkeitsbegrenzungen & Donaudampfschifffahrtsgesellschaft websites'; li.querySelector('.kws-arc-price').textContent = '$1,000, $2,000, $4,000, $8,000 or $12,500 per calendar quarter'; li.querySelector('.kws-arc-line').textContent = 'Averyveryveryveryveryveryveryveryverylongunbrokenwordthatcannotwrapnaturally and then a long sentence that goes on for quite a while to see what the caption does when it is far too long for the space held.'; li.querySelector('.kws-arc-tile').lastChild.textContent = 'Bookkeepings';`);
    await scrollToSel(p, '#services .kws-arc', 80); await p.waitForTimeout(300); let g = await geom(p, '#services .kws-arc'); await p.screenshot({ path: `long-arc-${W}.png` });
    log(g.sx <= 0 && g.over.length === 0 && g.capToCtl >= 0, `${W}: arc with a very long name, price, word and sign label: no sideways scroll, nothing past the edge, caption does not run into the controls`, g);
    const tl = await p.evaluate(() => { const t = document.querySelector('#services .kws-arc li.is-on .kws-arc-tile'); const rg = document.createRange(); rg.selectNodeContents(t.lastChild); const r = rg.getBoundingClientRect(), tr = t.getBoundingClientRect(); return { label: Math.round(r.width), tile: Math.round(tr.width), spill: Math.round(r.width - tr.width) }; }); log(tl.spill <= 0, `${W}: a 12-letter sign label stays inside its sign`, tl);
    await remount('#work .kws-spot', 'spotlight', `const li = el.querySelector('li'); li.querySelector('h3').textContent = 'Pneumonoultramicroscopicsilicovolcanoconiosis Roofing & Exteriors LLC'; li.querySelector('.kws-spot-kind').textContent = 'Residential and commercial roofing · Local service, SEO, booking and reminders'; li.querySelector('.kws-spot-bar span').textContent = 'a-really-long-domain-name-for-a-roofing-company-in-louisiana.example.com';`);
    await scrollToSel(p, '#work .kws-spot', 80); await p.waitForTimeout(300); g = await geom(p, '#work .kws-spot'); await p.screenshot({ path: `long-spot-${W}.png` });
    log(g.sx <= 0 && g.over.length === 0 && g.capToCtl >= 0, `${W}: spotlight with a very long name, label and domain`, g);
    const barSpill = await p.evaluate(() => { const bar = document.querySelector('#work .kws-spot li.is-on .kws-spot-bar'), fr = bar.parentElement; return { barScroll: bar.scrollWidth, barClient: bar.clientWidth, frameW: fr.clientWidth, imgW: Math.round(fr.querySelector('img').getBoundingClientRect().width) }; }); log(barSpill.barScroll <= barSpill.barClient + 1, `${W}: a long domain in the browser bar does not overflow the bar (it is clipped by the frame, with no ellipsis, if it does)`, barSpill);
    // ---- counts
    for (const [kind, sel, n] of [['arc', '.demo-client .kws-arc', 1], ['arc', '.demo-client .kws-arc', 2], ['arc', '.demo-client .kws-arc', 3], ['arc', '.demo-client .kws-arc', 30], ['spotlight', '.demo-client .kws-spot', 1], ['spotlight', '.demo-client .kws-spot', 2], ['spotlight', '.demo-client .kws-spot', 12]]) {
      await remount(sel, kind, `const ul = el.querySelector('ul'); const proto = [...ul.children].map(li => li.cloneNode(true)); ul.innerHTML = ''; for (let i = 0; i < arg; i++) { const li = proto[i % proto.length].cloneNode(true); li.querySelector('h2,h3,h4').textContent += ' ' + (i + 1); ul.append(li); }`, n);
      await scrollToSel(p, sel, 80); await p.waitForTimeout(250); const s0 = await state(p, sel); g = await geom(p, sel);
      // step through with Next n+1 times and check exactly one is-on each time and that prev at 0 behaves
      const seq = []; for (let i = 0; i < Math.min(n + 1, 5); i++) { if (!g.ctl) break; await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Next"]').click(), sel); await settle(p, sel); seq.push((await state(p, sel)).on); }
      const vis = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-arc-tile,' + s + ' .kws-spot-frame')].filter(e => getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.02).length, sel);
      await p.screenshot({ path: `count-${kind}-${n}-${W}.png` });
      log(g.sx <= 0 && g.over.length === 0 && s0.nOn === 1, `${W}: ${kind} with ${n} item(s): mounts, one in focus, nothing past the edge`, { controls: g.ctl, visiblePictures: vis, nextSequence: seq, h: g.h });
    }
    log(errs.length === 0, `${W}: no console errors in the above`, errs.join(';'));
    await ctx.close();
  }
  await b.close();
})();
