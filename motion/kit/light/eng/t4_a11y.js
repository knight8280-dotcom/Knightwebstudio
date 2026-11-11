const { launch, ctx, URL, PORT } = require('./common');
(async () => {
  const b = await launch();
  const c = await ctx(b, { viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  // A11y tree for the kit parts
  for (const sel of ['#services .kws-marks', '#process .kws-folders', '#pricing .kws-folders', '.demo-brand .kws-folders', '.footer-links', '#top']) {
    try { console.log('--- ARIA', sel, '\n' + (await p.locator(sel).first().ariaSnapshot()).slice(0, 2600)); } catch (e) { console.log('aria snapshot failed', sel, e.message.slice(0, 200)); }
  }
  // canvases / shader layers in the a11y tree?
  console.log('shader layers aria-hidden:', await p.evaluate(() => [...document.querySelectorAll('.kws-shader')].map(s => s.getAttribute('aria-hidden')).join(',')), '| canvases:', await p.evaluate(() => [...document.querySelectorAll('canvas')].map(c => (c.closest('[aria-hidden="true"]') ? 'hidden' : 'EXPOSED') + (c.tabIndex >= 0 ? ' FOCUSABLE' : '')).join(',')));
  // Tab order through main
  await p.evaluate(() => { scrollTo(0, 0); document.querySelector('.skip-link').focus(); });
  const seq = [];
  for (let i = 0; i < 70; i++) {
    await p.keyboard.press('Tab'); await p.waitForTimeout(60);
    const f = await p.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const af = getComputedStyle(e, '::after');
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ? `outline ${cs.outlineWidth} ${cs.outlineColor}` : (af.outlineStyle !== 'none' && parseFloat(af.outlineWidth) > 0 ? `::after outline ${af.outlineWidth} ${af.outlineColor}` : (cs.boxShadow !== 'none' ? 'box-shadow' : 'NO RING'));
      // obscured? sample centre
      const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = r.top + Math.min(r.height / 2, 20);
      const top = document.elementFromPoint(cx, cy);
      const obsc = top && !(e.contains(top) || top.contains(e) || (e.closest('.kws-link') && e.closest('.kws-link').contains(top))) ? 'OBSCURED by ' + top.tagName + '.' + (top.className || '').toString().slice(0, 30) : '';
      const inMain = !!e.closest('main'), kit = !!e.closest('[class*="kws-"]');
      return { tag: e.tagName, role: e.getAttribute('role'), name: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 40), cls: (e.className || '').toString().slice(0, 30), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], ring, inView: r.top >= 0 && r.bottom <= innerHeight, obsc, inMain, kit };
    });
    if (f) seq.push(f);
    if (f && f.cls.includes('kws-motion') && f.name && seq.filter(s => s.cls.includes('kws-motion')).length >= 2) break;
  }
  console.log('--- TAB ORDER (kit elements + neighbours):');
  seq.forEach((s, i) => { if (s.kit || (seq[i + 1] && seq[i + 1].kit) || (seq[i - 1] && seq[i - 1].kit)) console.log(`${i}. ${s.kit ? 'KIT ' : '    '}${s.tag}${s.role ? '[' + s.role + ']' : ''} "${s.name}" rect ${s.rect} ${s.ring} ${s.inView ? '' : 'NOT FULLY IN VIEW '}${s.obsc}`); });
  // Keyboard in tabs
  await p.evaluate(() => document.querySelector('#pricing [role=tab]').focus());
  const st = () => p.evaluate(() => ({ sel: [...document.querySelectorAll('#pricing [role=tab]')].findIndex(t => t.getAttribute('aria-selected') === 'true'), focus: [...document.querySelectorAll('#pricing [role=tab]')].indexOf(document.activeElement), front: [...document.querySelectorAll('#pricing .kws-folder')].findIndex(f => f.classList.contains('is-front')), url: location.href.split('/').pop() }));
  const log = [];
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'End', 'Home', 'ArrowDown', 'ArrowUp', 'Enter', ' ']) { await p.keyboard.press(k); log.push(k + '→' + JSON.stringify(await st())); }
  console.log('--- KEYS', log.join('\n   '));
  // does Alt+ArrowLeft get swallowed?
  const sw = await p.evaluate(() => { const t = document.querySelector('#pricing [role=tab][aria-selected=true]'); const out = {}; for (const mod of ['altKey', 'metaKey', 'ctrlKey', 'shiftKey']) { const ev = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true, [mod]: true }); t.dispatchEvent(ev); out[mod] = ev.defaultPrevented; } return out; });
  console.log('modifier+ArrowLeft defaultPrevented:', JSON.stringify(sw), JSON.stringify(await st()));
  // rapid input
  await p.evaluate(() => { const tabs = document.querySelectorAll('#pricing [role=tab]'); for (let i = 0; i < 200; i++) tabs[(i * 7) % 4].click(); });
  for (let i = 0; i < 30; i++) await p.keyboard.press(i % 3 ? 'ArrowRight' : 'ArrowLeft');
  console.log('after rapid input:', JSON.stringify(await st()), 'front count', await p.evaluate(() => document.querySelectorAll('#pricing .is-front').length), 'selected count', await p.evaluate(() => document.querySelectorAll('#pricing [aria-selected=true]').length));
  // Targets at 390
  const targets = await p.evaluate(() => [...document.querySelectorAll('main [class*="kws-"] a, main [class*="kws-"] button, .kws-motion, [role=tab]')].filter(e => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden]'); }).map(e => { let r = e.getBoundingClientRect(); const af = getComputedStyle(e, '::after'); let note = ''; if (af.position === 'absolute' && af.content !== 'none' && e.closest('.kws-link')) { r = (e.closest('.kws-folder-body') || e.closest('.kws-link')).getBoundingClientRect(); note = ' (card overlay)'; } return { n: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 30) + note, w: Math.round(r.width), h: Math.round(r.height) }; }));
  console.log('--- TARGETS <44:', JSON.stringify(targets.filter(t => t.w < 44 || t.h < 44)), 'all:', targets.length, 'min', JSON.stringify(targets.sort((a, b) => Math.min(a.w, a.h) - Math.min(b.w, b.h)).slice(0, 4)));
  await c.close();
  // Small text at 360, 390, 430
  for (const w of [360, 390, 430]) {
    const c2 = await ctx(b, { viewport: { width: w, height: 844 } }); const p2 = await c2.newPage();
    for (const url of [URL, PORT]) {
      await p2.goto(url, { waitUntil: 'load' }); await p2.waitForTimeout(800);
      const small = await p2.evaluate(() => { const out = {}; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (!/\S/.test(n.data)) continue; const e = n.parentElement; if (!e.closest('[class*="kws-"]')) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue; const r = e.getBoundingClientRect(); if (!r.width) continue; const fs = parseFloat(cs.fontSize); if (fs < 15) { const k = (e.className || e.parentElement.className || e.tagName).toString().split(' ')[0] + ' ' + fs.toFixed(1) + 'px ' + (cs.textTransform === 'uppercase' ? 'UPPER' : 'mixed') + ' w' + cs.fontWeight; out[k] = out[k] || n.data.trim().slice(0, 24); } } return out; });
      console.log(`--- SMALL TEXT @${w} ${url.split('/').pop()}:`, JSON.stringify(small));
    }
    await c2.close();
  }
  await b.close();
})();
