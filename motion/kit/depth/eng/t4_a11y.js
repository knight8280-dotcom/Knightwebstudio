// 4. Accessibility: AX tree, tab order, focus, targets, text sizes, zoom.
const { chromium, DEMO, BARE, log, ok, open, jump, cur, settle } = require('./lib');
const fs = require('fs');
const CYL = '#how .kws-cyl', RING = '#included .kws-ring';
(async () => {
  const b = await chromium.launch();
  let p = await open(b, DEMO, { w: 1280, h: 900 });
  const cdp = await p.ctx.newCDPSession(p);
  // ---- AX tree
  await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const val = (n, k) => n[k] && n[k].value; const prop = (n, k) => { const q = (n.properties || []).find(x => x.name === k); return q && q.value.value; };
  const dump = (rootSel, file) => p.evaluate(s => { const e = document.querySelector(s); e.setAttribute('data-ax-root', '1'); }, rootSel).then(async () => {
    const { node } = await cdp.send('DOM.describeNode', { objectId: (await cdp.send('Runtime.evaluate', { expression: `document.querySelector('${rootSel}')` })).result.objectId });
    const root = nodes.find(n => n.backendDOMNodeId === node.backendNodeId); const lines = [];
    const walk = (n, d) => { if (!n) return; const ign = n.ignored; const role = val(n, 'role'); if (!ign && role !== 'none' && role !== 'generic' && role !== 'InlineTextBox') lines.push('  '.repeat(d) + `${role}${prop(n, 'roledescription') ? ' <' + prop(n, 'roledescription') + '>' : ''} "${(val(n, 'name') || '').slice(0, 90)}"${prop(n, 'live') ? ' live=' + prop(n, 'live') : ''}${n.properties && n.properties.find(x => x.name === 'focusable' && x.value.value) ? ' [focusable]' : ''}${(n.properties || []).filter(x => ['disabled', 'hidden'].includes(x.name) && x.value.value).map(x => ' ' + x.name).join('')}`); (n.childIds || []).forEach(c => walk(byId.get(c), d + (ign || role === 'none' || role === 'generic' ? 0 : 1))); };
    walk(root, 0); fs.writeFileSync(file, lines.join('\n')); return lines;
  });
  const cylTree = await dump(CYL, 'ax-cylinder.txt'), ringTree = await dump(RING, 'ax-ring.txt');
  log('AX tree, cylinder (first 22 lines of ' + cylTree.length + '):\n' + cylTree.slice(0, 22).join('\n'));
  log('...\n' + cylTree.slice(-12).join('\n'));
  log('AX tree, ring: ' + ringTree.length + ' lines; first 14:\n' + ringTree.slice(0, 14).join('\n'));
  const ringCardInTree = ringTree.filter(l => /StaticText/.test(l)).length;
  const stageAx = await p.evaluate(s => { const st = document.querySelector(s + ' .kws-ring-stage'); return { hidden: st.getAttribute('aria-hidden'), focusable: st.querySelectorAll('a,button,input,[tabindex],[contenteditable]').length, cards: st.querySelectorAll('.kws-ring-card').length }; }, RING);
  ok(stageAx.hidden === 'true' && stageAx.focusable === 0 && !ringTree.some(l => /kws-ring-card/.test(l)) && ringTree.filter(l => /^\s*listitem/.test(l)).length === 30, 'ring: stage hidden from the tree (30 cards in the DOM, 0 in the tree); 30 list items exposed', JSON.stringify(stageAx) + `; listitems ${ringTree.filter(l => /^\s*listitem/.test(l)).length}; headings ${ringTree.filter(l => /^\s*heading/.test(l)).length}`);
  ok(/^region <carousel> "One missed call/.test(cylTree[0]) && cylTree.filter(l => /listitem <slide> "\d of 5"/.test(l)).length === 5 && cylTree.filter(l => /^\s*button/.test(l)).length === 7, 'cylinder: region<carousel> with a name, a list, 5 listitem<slide> "n of 5", 7 buttons', cylTree[0]);

  // ---- tab order with links in the cards; focus lands on a side card
  await p.evaluate(s => { document.querySelectorAll(s + ' .kws-cyl-card').forEach((li, i) => { const a = document.createElement('a'); a.href = '#step-' + (i + 1); a.textContent = 'Read about step ' + (i + 1); a.className = 'x-link'; li.append(a); }); }, CYL);
  await jump(p, CYL, -200); await p.waitForTimeout(200);
  await p.evaluate(() => { const a = document.querySelector('#how .section-head'); a.tabIndex = -1; a.focus(); });
  const seq = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(900);
    const f = await p.evaluate(s => { const a = document.activeElement, el = document.querySelector(s); if (!el.contains(a)) return { out: a.tagName + '.' + a.className.toString().slice(0, 30) }; const r = a.getBoundingClientRect(), tr = el.querySelector('.kws-cyl-track').getBoundingClientRect(); const cs = getComputedStyle(a); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const card = a.closest('.kws-cyl-card');
      return { what: a.getAttribute('aria-label') || a.textContent, card: card ? [...card.parentNode.children].indexOf(card) : -1, on: [...el.querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), cardOp: card ? card.style.opacity : '', inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, notCovered: top === a || a.contains(top), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, said: el.querySelector('.kws-cyl-sr').textContent, w: Math.round(r.width), h: Math.round(r.height) }; }, CYL);
    seq.push(f); if (f.out) break;
  }
  const inside = seq.filter(f => !f.out);
  log('Tab order: ' + inside.map(f => `${f.what}${f.card > -1 ? ' (card ' + (f.card + 1) + ', centred: ' + (f.card === f.on) + ', opacity ' + f.cardOp + ')' : ''}`).join(' > ') + ' > ' + (seq[seq.length - 1].out || 'STILL INSIDE'));
  ok(inside.length === 12 && inside.slice(0, 5).every(f => f.card === f.on && f.cardOp === '1.000' && f.inView && f.notCovered) && !!seq[seq.length - 1].out, 'tab order: 5 links (each brings its card to the middle, fully opaque, in view, not covered), then 7 controls, then out', `${inside.length} stops inside`);
  ok(inside.every(f => /solid/.test(f.outline) && parseFloat(f.outline.split(' ')[1]) >= 2), 'every stop shows a focus outline of 2px or more', [...new Set(inside.map(f => f.outline))].join(' | '));
  ok(inside.slice(0, 5).every(f => f.said === ''), 'live region stays silent while focus alone moves the drum', inside.map(f => f.said).filter(Boolean).join('|'));
  // shift+tab back in from after
  await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(300); const back = await p.evaluate(() => document.activeElement.getAttribute('aria-label')); ok(back === 'Next step', 'Shift+Tab comes back in at Next (no trap)', back);
  // arrow keys from a link inside a card
  await p.focus(CYL + ' .kws-cyl-card.is-on .x-link'); const k0 = await cur(p, CYL); await p.keyboard.press('ArrowRight'); await settle(p, CYL); await p.waitForTimeout(100);
  const k = await p.evaluate(s => { const a = document.activeElement, el = document.querySelector(s), card = a.closest('.kws-cyl-card'); const r = a.getBoundingClientRect(); return { on: [...el.querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), focusCard: card ? [...card.parentNode.children].indexOf(card) : -1, focusOpacity: card ? card.style.opacity : '', x: Math.round(r.left), vw: innerWidth }; }, CYL);
  log(`INFO  ArrowRight with focus on a link in the centre card: drum moves ${k0 + 1} > ${k.on + 1}, focus stays on the link in card ${k.focusCard + 1} (now a side card at opacity ${k.focusOpacity}, link at x=${k.x} of ${k.vw})`);
  await p.ctx.close();

  // ---- focus after arrowing with the focused link carried off screen on a phone
  p = await open(b, DEMO, { w: 390, h: 844, touch: true });
  await p.evaluate(s => { document.querySelectorAll(s + ' .kws-cyl-card').forEach((li, i) => { const a = document.createElement('a'); a.href = '#step-' + (i + 1); a.textContent = 'Read about step ' + (i + 1); a.className = 'x-link'; li.append(a); }); }, CYL);
  await jump(p, CYL, -60); await p.focus(CYL + ' .kws-cyl-card.is-on .x-link'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await settle(p, CYL); await p.waitForTimeout(150);
  const ph = await p.evaluate(s => { const a = document.activeElement, r = a.getBoundingClientRect(), card = a.closest('.kws-cyl-card'); return { focus: a.textContent, visible: r.right > 0 && r.left < innerWidth, x: Math.round(r.left), op: card.style.opacity, on: [...document.querySelector(s).querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')) }; }, CYL);
  ok(ph.visible && +ph.op > .5, '390px: after two ArrowRight presses from a link in card 1, the focused element is still visible', JSON.stringify(ph));

  // ---- targets and text sizes on a phone
  for (const w of [390, 360]) {
    await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(300);
    const t = await p.evaluate(() => { const small = [], tiny = []; const seen = new Set();
      document.querySelectorAll('.kws-cyl *, .kws-ring-lists *').forEach(e => { if (e.closest('.x-link')) return; for (const n of e.childNodes) if (n.nodeType === 3 && n.data.trim()) { const fs = parseFloat(getComputedStyle(e).fontSize), up = getComputedStyle(e).textTransform === 'uppercase', key = e.className + '|' + fs; if (seen.has(key)) continue; seen.add(key); if (fs < 12) tiny.push(`${e.className || e.tagName} ${fs}px`); else if (fs < 15) small.push(`${(e.className || e.tagName).toString().slice(0, 28)} ${fs}px${up ? ' (uppercase label)' : ' "' + n.data.trim().slice(0, 24) + '"'}`); } });
      const btn = [...document.querySelectorAll('#how .kws-cyl-ctl button')].map(b => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
      return { small, tiny, btn }; });
    ok(t.btn.every(s => s.split('x').every(v => +v >= 44)), `${w}px: all 7 controls at least 44x44`, t.btn.join(' '));
    ok(t.tiny.length === 0, `${w}px: no text under 12px in the cylinder or the lists`, t.tiny.join('; '));
    log(`   ${w}px text between 12 and 15px: ` + t.small.join('; '));
  }
  // effective size of the words on the ring's front card and side cards at 390
  await p.setViewportSize({ width: 390, height: 844 }); await jump(p, RING, -150); await p.waitForTimeout(900);
  const rs = await p.evaluate(s => { const st = document.querySelector(s + ' .kws-ring-stage'); const out = []; st.querySelectorAll('.kws-ring-card').forEach(c => { if (!c.firstChild || c.firstChild.nodeType !== 3 || !c.firstChild.data) return; const r = document.createRange(); r.setStart(c.firstChild, 0); r.setEnd(c.firstChild, 1); const b = r.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(c).fontSize); const tab = c.lastChild.getBoundingClientRect(); const tfs = parseFloat(getComputedStyle(c.lastChild).fontSize); out.push({ front: c.classList.contains('is-front'), word: c.firstChild.data.slice(0, 16), lineH: +(b.height).toFixed(1), eff: +(b.height / (fs * 1.2) * fs).toFixed(1), tabEff: c.lastChild.textContent ? +(tab.height / (tfs * 1.9 + 2) * tfs).toFixed(1) : 0 }); }); return out; }, RING);
  const front = rs.find(r => r.front), others = rs.filter(r => !r.front).map(r => r.eff).sort((a, b) => a - b);
  log(`INFO  390px ring: front card "${front.word}" effective text size ${front.eff}px, its tab ${front.tabEff}px; the other ${others.length} facing cards ${others[0]} to ${others[others.length - 1]}px (decoration, aria-hidden; the same words are in the lists at 15px)`);
  await p.ctx.close();

  // ---- more cards than the demo: dots at 360/390 with 6 and 7 cards
  for (const n of [6, 7]) for (const w of [360, 390]) {
    p = await open(b, DEMO, { w, h: 800, touch: true, wait: 0, route: ctx => ctx.route(/demo\.html/, async r => { const res = await r.fetch(); let body = await res.text(); const m = body.match(/<li class="kws-cyl-card">[\s\S]*?<\/li>\s*(?=<li class="kws-cyl-card">)/); body = body.replace(m[0], m[0].repeat(n - 4)); r.fulfill({ response: res, body }); }) });
    await p.waitForTimeout(500);
    const t = await p.evaluate(() => { const el = document.querySelector('#how .kws-cyl'); const bs = [...el.querySelectorAll('.kws-cyl-ctl button')].map(b => b.getBoundingClientRect()); return { cards: el.querySelectorAll('.kws-cyl-card').length, sizes: bs.map(r => Math.round(r.width) + 'x' + Math.round(r.height)), left: Math.round(bs[0].left), right: Math.round(bs[bs.length - 1].right), vw: innerWidth }; });
    ok(t.sizes.every(s => s.split('x').every(v => +v >= 44)) && t.left >= 0 && t.right <= t.vw, `${t.cards} cards at ${w}px: every control at least 44x44 and inside the screen`, `${t.sizes.join(' ')}; row spans ${t.left} to ${t.right} of ${t.vw}`);
    await p.ctx.close();
  }

  // ---- zoom: 200% of a 1280 window is a 640px layout; 400% is 320px (reflow)
  for (const [w, h, label] of [[640, 450, '1280 window at 200%'], [320, 256, '1280 window at 400% (320px reflow)']]) {
    p = await open(b, DEMO, { w, h, dpr: 2 });
    const z = await p.evaluate(() => { const el = document.querySelector('#how .kws-cyl'), on = el.querySelector('.is-on').getBoundingClientRect(), bs = [...el.querySelectorAll('.kws-cyl-ctl button')].map(b => b.getBoundingClientRect()); const ring = document.querySelector('#included .kws-ring'), lists = ring.querySelector('.kws-ring-lists'); const cut = [...document.querySelectorAll('.kws-cyl-card.is-on *, .kws-ring-lists *')].filter(e => e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && getComputedStyle(e).display !== 'inline').map(e => e.className || e.tagName); const wide = [...document.querySelectorAll('.kws-ring-lists *, .kws-cyl-ctl *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).length;
      return { sw: document.documentElement.scrollWidth - innerWidth, bodySw: document.body.scrollWidth - innerWidth, card: Math.round(on.width) + 'x' + Math.round(on.height), cardInView: on.left >= 0 && on.right <= innerWidth, ctlInView: bs.every(r => r.left >= 0 && r.right <= innerWidth), btn: Math.min(...bs.map(r => Math.round(r.width))), stage: getComputedStyle(ring.querySelector('.kws-ring-stage')).display, cols: getComputedStyle(lists).gridTemplateColumns.split(' ').length, cut: cut.slice(0, 5), wide, vh: innerHeight }; });
    ok(z.sw <= 0 && z.cardInView && z.ctlInView && z.wide === 0 && z.cut.length === 0, `${label}: no sideways scroll, centre card and controls inside the screen, nothing cut`, JSON.stringify(z));
    await jump(p, CYL, -10); await p.waitForTimeout(200); await p.screenshot({ path: `shots/zoom-${w}-cyl.png` });
    await jump(p, RING, -10); await p.waitForTimeout(600); await p.screenshot({ path: `shots/zoom-${w}-ring.png` });
    await p.ctx.close();
  }
  await b.close();
})();
