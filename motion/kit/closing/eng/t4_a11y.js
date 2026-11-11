// 3+4. Input and accessibility: listeners, touch-action, wheel, touch scroll; AX tree; tab order; focus visible / not obscured; targets; small text.
const { launch, open, end } = require('./common');
const fs = require('fs');
const ROOTS = '.kws-close, .kws-appt, .kws-foot';
(async () => {
  const b = await launch();
  // ---- listeners and touch-action ----
  {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    await p.waitForTimeout(1500);
    const s = await p.context().newCDPSession(p);
    const { result } = await s.send('Runtime.evaluate', { expression: `[...document.querySelectorAll('${ROOTS.split(', ').map(r => r + ', ' + r + ' *').join(', ')}')]`, objectGroup: 'g' });
    const props = await s.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
    const found = {};
    for (const pr of props.result) { if (!pr.value || !pr.value.objectId || isNaN(+pr.name)) continue; const l = await s.send('DOMDebugger.getEventListeners', { objectId: pr.value.objectId }); for (const x of l.listeners) { const k = x.type + (x.passive ? ' (passive)' : '') + ' @' + (x.scriptId ? (x.lineNumber + ':' + x.columnNumber) : ''); found[k] = (found[k] || 0) + 1; } }
    const win = await s.send('Runtime.evaluate', { expression: 'window', objectGroup: 'g' }); const wl = await s.send('DOMDebugger.getEventListeners', { objectId: win.result.objectId });
    const doc = await s.send('Runtime.evaluate', { expression: 'document', objectGroup: 'g' }); const dl = await s.send('DOMDebugger.getEventListeners', { objectId: doc.result.objectId });
    console.log('listeners on kit elements (pricing copy, main.js + shader.js running):', JSON.stringify(found));
    console.log('window listeners:', wl.listeners.map(x => x.type + (x.passive ? '(passive)' : '(active)')).join(', '), '| document:', dl.listeners.map(x => x.type + (x.passive ? '(passive)' : '(active)')).join(', '));
    const ta = await p.evaluate(ROOTS => { const bad = []; for (const el of document.querySelectorAll(':is(' + ROOTS + '), :is(' + ROOTS + ') *')) { const cs = getComputedStyle(el); if (cs.touchAction !== 'auto' || cs.overscrollBehavior !== 'auto' || cs.userSelect === 'none' || cs.scrollSnapType !== 'none') bad.push(el.className + ':' + cs.touchAction + '/' + cs.userSelect); if (cs.willChange !== 'auto') bad.push(el.className + ' will-change:' + cs.willChange); } return bad; }, ROOTS);
    console.log('touch-action / user-select / will-change oddities in kit elements:', ta.length ? ta.slice(0, 10).join('; ') : 'none');
    // touch scroll over each part, via CDP synthesizeScrollGesture (real compositor gesture)
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    for (const sel of ['.kws-close-title', '.kws-appt', '.kws-close-btn', '.kws-foot-tel', '.kws-foot-two', '.kws-skyline', '.kws-foot .kws-motion']) {
      await p.evaluate(sel => { const e = document.querySelector(sel); const q = e.getBoundingClientRect(); scrollTo(0, q.top + scrollY - 420); }, sel);
      await p.waitForTimeout(250);
      const pos = await p.evaluate(sel => { const q = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(q.left + Math.min(q.width / 2, 60)), y: Math.round(q.top + q.height / 2), sy: scrollY, max: document.documentElement.scrollHeight - innerHeight }; }, sel);
      const dir = pos.sy >= pos.max - 2 ? 1 : -1;   // at the very end, swipe down instead
      await s.send('Input.synthesizeScrollGesture', { x: pos.x, y: Math.min(pos.y, 760), yDistance: 180 * dir, xDistance: 0, speed: 900, gestureSourceType: 'touch', preventFling: true });
      await p.waitForTimeout(250);
      const sy1 = await p.evaluate(() => scrollY);
      await s.send('Input.synthesizeScrollGesture', { x: pos.x, y: Math.min(pos.y, 760), yDistance: 0, xDistance: -150, speed: 900, gestureSourceType: 'touch', preventFling: true });
      await p.waitForTimeout(200);
      const r2 = await p.evaluate(() => [scrollX, location.pathname]);
      // wheel
      const syw0 = await p.evaluate(() => scrollY);
      await s.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: pos.x, y: Math.min(pos.y, 760), deltaX: 0, deltaY: 120 * (dir === 1 ? -1 : 1) });
      await p.waitForTimeout(250);
      const syw1 = await p.evaluate(() => scrollY);
      console.log(`touch on ${sel}: 180px ${dir === 1 ? 'down' : 'up'}-swipe moved page ${sy1 - pos.sy}px; sideways swipe scrollX=${r2[0]}; wheel 120 moved ${syw1 - syw0}px; still on ${r2[1].split('/').pop()}`);
    }
    // tap = navigation, exactly one
    await p.evaluate(() => { const e = document.querySelector('.kws-close-btn'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 300); window.__nav = 0; document.addEventListener('click', e => { window.__nav++; if (e.target.closest('a')) e.preventDefault(); }, true); });
    await p.waitForTimeout(200);
    await p.tap('.kws-close-btn'); await p.tap('.kws-appt-btn');
    console.log('taps on enquiry + card booking button -> click events:', await p.evaluate(() => window.__nav), '| booking button now:', await p.evaluate(() => { const a = document.querySelector('.kws-appt-btn'); return a.href + ' target=' + a.target + ' rel=' + a.rel; }));
    await p.context().close();
  }

  // ---- accessibility tree ----
  for (const url of ['test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html']) {
    const p = await open(b, url, { ctx: { viewport: { width: 1440, height: 900 } } });
    await p.waitForTimeout(1500);
    const s = await p.context().newCDPSession(p);
    await s.send('Accessibility.enable');
    const { nodes } = await s.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map(n => [n.nodeId, n]));
    const lines = [];
    const walk = (n, d, inKit) => {
      const role = n.role && n.role.value, name = n.name && n.name.value || '';
      const isRoot = role === 'contentinfo' || (role === 'region' && /deciding|business|Tell|call|project|Ready|start/i.test(name)) ;
      const here = inKit || isRoot;
      if (here && !n.ignored && role && !/^(none|generic|InlineTextBox|StaticText|LineBreak|ListMarker)$/.test(role)) lines.push('  '.repeat(d) + role + (name ? ' "' + name.slice(0, 70) + '"' : '') + (n.properties || []).filter(x => /focusable|level|hidden|pressed|expanded/.test(x.name)).map(x => ' [' + x.name + '=' + x.value.value + ']').join(''));
      else if (here && !n.ignored && role === 'StaticText' && name.trim()) lines.push('  '.repeat(d) + '· ' + name.slice(0, 70));
      for (const c of n.childIds || []) { const k = byId.get(c); if (k) walk(k, here && !n.ignored ? d + 1 : d, here); }
    };
    walk(nodes[0], 0, false);
    fs.writeFileSync(`axtree-${url.replace(/\W+/g, '-')}.txt`, lines.join('\n'));
    const txt = lines.join('\n');
    console.log(`\nAX tree ${url}: ${lines.length} lines -> axtree-${url.replace(/\W+/g, '-')}.txt ; mentions canvas: ${/canvas/i.test(txt)}; image/graphics nodes: ${(txt.match(/^\s*(image|img|graphics-document|graphics-symbol)\b.*$/gm) || []).join(' ; ') || 'none'}; headings in contentinfo: ${(txt.split(/^contentinfo/m)[1] || '').match(/heading/g) ? 'YES' : 'none'}`);
    await p.context().close();
  }

  // ---- tab order, focus visible, focus not obscured, both phone and desktop ----
  for (const [w, h, url] of [[390, 844, 'test/pricing-with-kit.html'], [1440, 900, 'test/pricing-with-kit.html'], [390, 844, 'portable.html'], [390, 844, 'test/start-with-kit.html']]) {
    const p = await open(b, url, { ctx: { viewport: { width: w, height: h } } });
    await p.waitForTimeout(1200);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.kws-close'); scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight * .7); });
    await p.waitForTimeout(500);
    // focus the last focusable before the band, then Tab forward
    await p.evaluate(() => { const all = [...document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]')].filter(e => e.offsetParent !== null && !e.closest('[hidden]')); const first = document.querySelector('.kws-close a'); const i = all.indexOf(first); (all[i - 1] || document.body).focus(); });
    const stops = [], probs = [];
    for (let i = 0; i < 45; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const r = await p.evaluate(ROOTS => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el), q = el.getBoundingClientRect();
        const obsc = [];
        for (const f of document.querySelectorAll('#mobile-cta, .site-header, .demo-bar, .topbar')) { const fc = getComputedStyle(f); if (!/fixed|sticky/.test(fc.position) || fc.visibility === 'hidden' || fc.display === 'none') continue; const fq = f.getBoundingClientRect(); if (f.id === 'mobile-cta' && !f.classList.contains('show')) continue; const ov = Math.max(0, Math.min(q.bottom, fq.bottom) - Math.max(q.top, fq.top)); if (ov > 0 && q.right > fq.left && q.left < fq.right) obsc.push((f.id || f.className) + ' overlaps ' + Math.round(ov) + 'px of ' + Math.round(q.height)); }
        return { t: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 30), tag: el.tagName, kit: !!el.closest(ROOTS), hid: !!el.closest('[aria-hidden="true"]'), ow: cs.outlineWidth, os: cs.outlineStyle, oc: cs.outlineColor, oo: cs.outlineOffset, top: Math.round(q.top), bottom: Math.round(q.bottom), inView: q.top >= 0 && q.bottom <= innerHeight, obsc, wh: Math.round(q.width) + 'x' + Math.round(q.height) };
      }, ROOTS);
      if (!r) break; if (!r.kit) { if (stops.length) break; else continue; }
      stops.push(r.t);
      if (r.hid) probs.push(r.t + ': inside aria-hidden');
      if (r.os === 'none' || parseFloat(r.ow) < 2) probs.push(r.t + ': outline ' + r.os + ' ' + r.ow);
      if (!r.inView) probs.push(r.t + ': not fully in view (' + r.top + '..' + r.bottom + ')');
      if (r.obsc.length) probs.push(r.t + ': ' + r.obsc.join(','));
      if (stops.length === 1 || /Start a project|255-0837|Pause|Send an enq/.test(r.t)) { if (w === 390 || /portable/.test(url)) await p.screenshot({ path: `focus-${url.replace(/\W+/g, '-')}-${w}-${stops.length}.png`, clip: { x: 0, y: Math.max(0, r.top - 60), width: w, height: Math.min(200, h - Math.max(0, r.top - 60)) } }); }
      if (stops.length <= 3 || /Pause/.test(r.t)) console.log(`   [${w} ${url}] stop ${stops.length} "${r.t}" ${r.tag} ${r.wh} outline ${r.ow} ${r.os} ${r.oc} offset ${r.oo}`);
    }
    console.log(`[${w} ${url}] ${stops.length} tab stops: ${stops.join(' > ')}\n   problems: ${probs.join(' | ') || 'none'}`);
    // shift+tab back works (no trap)
    for (let i = 0; i < 4; i++) await p.keyboard.press('Shift+Tab');
    console.log('   after 4x Shift+Tab focus is on:', await p.evaluate(() => (document.activeElement.textContent || '').trim().slice(0, 30)));
    await p.context().close();
  }

  // ---- targets at 390 and 360, spacing, small text ----
  for (const url of ['demo.html', 'portable.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html']) for (const w of [360, 390]) {
    const p = await open(b, url, { ctx: { viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true } });
    await p.waitForTimeout(900);
    const r = await p.evaluate(ROOTS => {
      const small = [], close = [], rects = [];
      for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, button)')) { const cs = getComputedStyle(el), q = el.getBoundingClientRect(); if (cs.display === 'none' || el.closest('[hidden], [aria-hidden="true"]') || !q.width) continue; rects.push({ t: el.textContent.trim().slice(0, 18) || el.getAttribute('aria-label'), q: { l: q.left, r: q.right, t: q.top + scrollY, b: q.bottom + scrollY } }); if (q.height < 44 || q.width < 44) small.push((el.textContent.trim().slice(0, 20) || el.getAttribute('aria-label')) + ' ' + q.width.toFixed(1) + 'x' + q.height.toFixed(1)); }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i].q, c = rects[j].q; const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.b, c.b) - Math.max(a.t, c.t); if (ox > 0 && oy > 0) close.push(rects[i].t + ' overlaps ' + rects[j].t + ' by ' + Math.round(ox) + 'x' + Math.round(oy)); }
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const sizes = {};
      while (tw.nextNode()) { const el = tw.currentNode.parentElement; if (!tw.currentNode.data.trim() || !el.closest(ROOTS) || el.closest('[aria-hidden="true"], svg, [hidden]')) continue; const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); if (fs < 15) { const k = fs + 'px ' + (cs.textTransform === 'uppercase' ? 'CAPS' : 'mixed') + ' .' + String(el.className || el.parentElement.className).split(' ')[0]; sizes[k] = (sizes[k] || 0) + 1; } }
      return { small, close, sizes, n: rects.length };
    }, ROOTS);
    console.log(`targets ${url} ${w}: ${r.n} links/buttons; under 44: ${r.small.join('; ') || 'none'}; overlapping targets: ${r.close.join('; ') || 'none'}; text under 15px: ${JSON.stringify(r.sizes)}`);
    await p.context().close();
  }
  await b.close();
})();
