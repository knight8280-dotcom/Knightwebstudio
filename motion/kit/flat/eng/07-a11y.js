// Accessibility: AX tree dump, tab walk (both directions), focus ring geometry, targets, live region chatter.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Accessibility.enable');
  // ---- AX tree of the two site-palette components
  for (const sel of ['#services .kws-arc', '#work .kws-spot']) {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 }); const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
    const { nodes } = await cdp.send('Accessibility.queryAXTree', { nodeId }).catch(() => ({ nodes: [] }));
    const full = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    // walk children
    const byId = new Map(); const all = (await cdp.send('Accessibility.getFullAXTree')).nodes; all.forEach(n => byId.set(n.nodeId, n));
    const rootAx = all.find(n => n.backendDOMNodeId === full.nodes[0].backendDOMNodeId) || full.nodes[0];
    const lines = []; const walk = (n, d) => { if (!n) return; const role = n.role && n.role.value; const name = n.name && n.name.value; const props = (n.properties || []).filter(x => ['focusable', 'live', 'roledescription', 'hidden', 'level', 'url', 'disabled', 'pressed', 'selected', 'expanded', 'description'].includes(x.name)).map(x => `${x.name}=${x.value.value}`).join(' ');
      if (!n.ignored && role !== 'InlineTextBox') lines.push(`${'  '.repeat(d)}${role}${name ? ` "${name}"` : ''}${props ? ` [${props}]` : ''}`);
      (n.childIds || []).forEach(c => walk(byId.get(c), n.ignored ? d : d + 1)); };
    walk(rootAx, 0); fs.writeFileSync(`axtree-${sel.includes('arc') ? 'arc' : 'spot'}.txt`, lines.join('\n'));
    console.log(`\n== AX tree ${sel} (${lines.length} lines; first 46) ==\n` + lines.slice(0, 46).join('\n'));
    const tail = lines.slice(-16); console.log('   ...\n' + tail.join('\n'));
  }
  // aria-current values, roles etc. from DOM
  console.log('\n== ARIA attributes =='); console.log(JSON.stringify(await p.evaluate(() => ['#services .kws-arc', '#work .kws-spot'].map(s => { const el = document.querySelector(s); const dots = [...el.querySelectorAll('[class$=-dot]')];
    return { root: [el.tagName, el.getAttribute('role'), el.getAttribute('aria-roledescription'), el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')], li0: [...el.querySelector('li').attributes].map(a => a.name + '=' + a.value), ctl: [...el.querySelector('[role=group]').attributes].map(a => a.name + '=' + a.value), dots: dots.map(d => [d.getAttribute('aria-current'), d.tabIndex]).join('|'), live: [...el.querySelector('[aria-live]').attributes].map(a => a.name + '=' + a.value), hiddenTiles: [...el.querySelectorAll('.kws-arc-tile,.kws-spot-bar')].every(t => t.getAttribute('aria-hidden') === 'true'), imgAlts: [...el.querySelectorAll('img')].map(i => i.alt) }; })), null, 1));
  await ctx.close();

  // ---- Tab walk on desktop (keyboard users), forward then backward; record what has focus, whether visible and centred; count stops
  for (const [W, H] of [[1280, 800], [390, 844]]) {
    const c2 = await b.newContext({ viewport: { width: W, height: H } }); const q = await c2.newPage(); await q.goto(URL, { waitUntil: 'load' }); await q.waitForTimeout(400);
    await q.evaluate(() => { window.__says = []; document.querySelectorAll('[aria-live]').forEach((l, i) => new MutationObserver(() => window.__says.push([i, Math.round(performance.now()), l.textContent])).observe(l, { childList: true, characterData: true, subtree: true })); });
    const info = () => q.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); const root = a.closest('.kws-arc,.kws-spot');
      const li = a.closest('li'); let op = 1; for (let e = a; e && e !== document.body; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
      const mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { tag: a.tagName, name: a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30), inKit: root ? (root.className.split(' ')[0] + (root.closest('.demo-client') ? '(client)' : '')) : '', on: li ? li.classList.contains('is-on') : null, op: +op.toFixed(2), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} off ${cs.outlineOffset}`, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, hit: mid ? (a.contains(mid) || mid.contains(a)) : false, moving: root ? root.classList.contains('is-moving') : null }; });
    const stops = []; let guard = 0; await q.keyboard.press('Tab');
    while (guard++ < 80) { const immediate = await info(); await q.waitForTimeout(900); const i = await info(); if (!i) break; i.opAtFocus = immediate ? immediate.op : null; stops.push(i); if (i.name === 'See the work in detail' && stops.filter(s => s.name === i.name).length > 1) break; await q.keyboard.press('Tab'); }
    const kit = stops.filter(s => s.inKit);
    console.log(`\n== Tab walk ${W}px: ${stops.length} stops, ${kit.length} inside kit components ==`);
    for (const s of stops.slice(0, 26)) console.log(`  ${s.inKit.padEnd(16)} ${s.tag} "${s.name}" on=${s.on} opacityNow=${s.op} opacityAtFocus=${s.opAtFocus} inView=${s.inView} hit=${s.hit} outline=${s.outline} rect=${s.rect}`);
    const bad = kit.filter(s => !s.inView || !s.hit || s.op < 1 || !/solid/.test(s.outline) || (s.on === false));
    console.log(`  problems among kit stops after settling: ${bad.length}`, bad.length ? JSON.stringify(bad.slice(0, 4)) : '');
    console.log('  live-region messages caused by Tab alone:', JSON.stringify(await q.evaluate(() => window.__says)));
    // backwards from the control row of the first arc
    await q.evaluate(() => { window.__says.length = 0; }); await q.locator('#services .kws-arc button[aria-label^="Next"]').focus(); const back = [];
    for (let i = 0; i < 5; i++) { await q.keyboard.press('Shift+Tab'); await q.waitForTimeout(900); back.push(await info()); }
    console.log('  Shift+Tab from Next:', back.map(s => s && `${s.tag} "${s.name}" on=${s.on} op=${s.op}`).join('  <-  '));
    // Arrow keys on a link: where is focus and what is announced
    await q.evaluate(() => { window.__says.length = 0; }); await q.locator('#services .kws-arc li.is-on a').focus(); await q.keyboard.press('ArrowRight'); await q.waitForTimeout(900); const af = await info(); console.log('  ArrowRight on a link -> focus', af.name, 'on=', af.on, ' says:', JSON.stringify(await q.evaluate(() => window.__says)));
    // focus screenshot
    await q.screenshot({ path: `focus-link-${W}.png` });
    await q.locator('#services .kws-arc [aria-current=true]').focus(); await q.keyboard.press('ArrowRight'); await q.waitForTimeout(700); await q.screenshot({ path: `focus-dot-${W}.png` });
    await c2.close();
  }
  await b.close();
})();
