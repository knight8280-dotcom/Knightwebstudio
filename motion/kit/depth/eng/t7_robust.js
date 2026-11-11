// 6. Robustness: width sweep, long words, item counts, theme toggle mid-turn, bfcache, mount/unmount, removal.
const { chromium, DEMO, BARE, ONE, log, ok, open, jump, cur, settle } = require('./lib');
const CYL = '.kws-cyl', RING = '.kws-ring';
(async () => {
  const b = await chromium.launch();
  // ---- A. width sweep 320..1920 step 20, demo + bare, script on; page overflow measured with the body's own overflow clip lifted
  for (const [name, url] of [['demo', DEMO], ['bare', BARE]]) {
    const p = await open(b, url, { w: 360, h: 800 });
    const bad = [];
    for (let w = 320; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(90);
      const r = await p.evaluate(() => { const de = document.documentElement; const before = de.scrollWidth - de.clientWidth; document.body.style.overflowX = 'visible'; const lifted = de.scrollWidth - de.clientWidth; document.body.style.overflowX = '';
        // anything of the kit sticking out past the viewport that is not inside a kit clip
        const out = [...document.querySelectorAll('.kws-cyl, .kws-cyl *, .kws-ring, .kws-ring *')].filter(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; if (r.right <= innerWidth + .5 && r.left >= -.5) return false; return !e.closest('.kws-cyl-track') && !e.closest('.kws-ring-stage') || e.matches('.kws-cyl-track,.kws-ring-stage'); }).map(e => e.className).slice(0, 3);
        const live = document.querySelectorAll('.is-live').length; return { before, lifted, out, live }; });
      if (r.before > 0 || r.lifted > 0 || r.out.length) bad.push(`${w}px: page +${r.before} (+${r.lifted} with the body clip lifted) ${r.out.join(',')}`);
    }
    ok(bad.length === 0, `A. ${name}: no sideways scroll and nothing of the kit past the edge, 320 to 1920 in 20px steps (script on)`, bad.slice(0, 6).join(' | '));
    ok(p.errs.filter(e => !/404/.test(e)).length === 0, `A. ${name}: no script errors through 81 resizes`, p.errs.join('|').slice(0, 200));
    await p.ctx.close();
  }

  // ---- B. long words and long names
  for (const [name, url] of [['demo (site stylesheet)', DEMO], ['bare (no site stylesheet)', BARE]]) for (const w of [360, 390, 1280]) {
    const p = await open(b, url, { w, h: 900, wait: 0, route: ctx => ctx.route(/(demo|bare)\.html/, async r => { const res = await r.fetch(); let body = await res.text();
      body = body.replace(/<h3 class="kws-cyl-title">[^<]*<\/h3>/, '<h3 class="kws-cyl-title">Donaudampfschifffahrtsgesellschaftskapitän Rechtsschutzversicherungsgesellschaften</h3>')
        .replace(/(<p class="kws-cyl-text">)[^<]*/, '$1Supercalifragilisticexpialidocious-and-pneumonoultramicroscopicsilicovolcanoconiosis in one unbroken run of text for a card.')
        .replace(/<li>Contact form<\/li>/, '<li>Photogrammetrically-georeferenced orthomosaicking and a very long inclusion name that runs on and on past three lines of an index card</li>')
        .replace(/(<p class="kws-cyl-tag"><b aria-hidden="true">1<\/b>)[^<]*/, '$1Extraordinarilylongservicenamewithoutanyspaces · $750 setup');
      r.fulfill({ response: res, body }); }) });
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => { const card = document.querySelector('.kws-cyl-card'), cr = card.getBoundingClientRect(); const spill = [...card.querySelectorAll('.kws-cyl-title,.kws-cyl-text,.kws-cyl-tag')].map(e => { const rg = document.createRange(); rg.selectNodeContents(e); const rr = rg.getBoundingClientRect(); return { cls: e.className, over: Math.round(Math.max(rr.right - cr.right, cr.left - rr.left)), sw: e.scrollWidth - e.clientWidth }; });
      const li = [...document.querySelectorAll('.kws-ring-group li')].find(l => /Photogram/.test(l.textContent)), g = li.closest('.kws-ring-group').getBoundingClientRect(), lr = (() => { const rg = document.createRange(); rg.selectNodeContents(li); return rg.getBoundingClientRect(); })();
      const rc = [...document.querySelectorAll('.kws-ring-card')].find(c => /Photogram/.test(c.textContent)); let ring = null; if (rc) { ring = { textH: rc.scrollHeight, boxH: rc.clientHeight, textW: rc.scrollWidth, boxW: rc.clientWidth }; }
      document.body.style.overflowX = 'visible'; const sw = document.documentElement.scrollWidth - document.documentElement.clientWidth; document.body.style.overflowX = '';
      return { spill, listOver: Math.round(lr.right - g.right), ring, sw, trackH: Math.round(document.querySelector('.kws-cyl-track').getBoundingClientRect().height) }; });
    const cardSpill = r.spill.filter(s => s.over > 0);
    ok(cardSpill.length === 0 && r.listOver <= 0 && r.sw <= 0, `B. ${name} ${w}px: very long words stay inside the story card and the list card; no sideways scroll`, `card text past the card edge: ${cardSpill.map(s => s.cls + ' +' + s.over + 'px').join(', ') || 'none'}; list line past its card: ${r.listOver}px; page +${r.sw}; ring card text ${r.ring ? r.ring.textW + 'x' + r.ring.textH + ' in a ' + r.ring.boxW + 'x' + r.ring.boxH + ' box' : 'n/a'}`);
    if (w !== 1280) { await p.evaluate(() => document.querySelector('.kws-cyl').scrollIntoView()); await p.screenshot({ path: `shots/longwords-${name.slice(0, 4)}-${w}-cyl.png` }); if (w === 390) { await p.evaluate(() => { const e = document.querySelector('.kws-ring-stage'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 100); }); await p.waitForTimeout(700); await p.screenshot({ path: `shots/longwords-${name.slice(0, 4)}-${w}-ring.png` }); } }
    await p.ctx.close();
  }

  // ---- C. item counts (mounted by hand on the bare page so nothing of the site is involved)
  const p = await open(b, BARE, { w: 390, h: 844 });
  const mk = (n, o = '') => p.evaluate(([n, o]) => { document.querySelectorAll('.x-test').forEach(e => e.remove()); const s = document.createElement('section'); s.className = 'kws-cyl x-test'; s.setAttribute('aria-label', 'test'); s.innerHTML = '<ol class="kws-cyl-track">' + Array.from({ length: n }, (_, i) => `<li class="kws-cyl-card"><h3 class="kws-cyl-title">Card ${i + 1}</h3><p class="kws-cyl-text">Text ${i + 1}</p></li>`).join('') + '</ol>'; document.body.prepend(s); const off = KWS.cylinder.mount(s, o ? JSON.parse(o) : {}); window.__off = off; const btn = [...s.querySelectorAll('.kws-cyl-ctl button')]; return { live: s.classList.contains('is-live'), ctl: btn.length, sizes: btn.map(x => Math.round(x.getBoundingClientRect().width)).join(','), padB: getComputedStyle(s).paddingBottom, h: Math.round(s.getBoundingClientRect().height), prevDis: btn[0] && btn[0].getAttribute('aria-disabled'), nextDis: btn.length && btn[btn.length - 1].getAttribute('aria-disabled') }; }, [n, o]);
  const step = async (k = 1) => { for (let i = 0; i < k; i++) await p.evaluate(() => document.querySelector('.x-test .kws-cyl-nav:last-child').click()); await settle(p, '.x-test'); return cur(p, '.x-test'); };
  let r = await mk(1); ok(!r.live && r.ctl === 0, 'C. one card: not upgraded, no dead controls', JSON.stringify(r));
  r = await mk(2); const c2a = await step(1), c2b = await step(1); const d2 = await p.evaluate(() => document.querySelector('.x-test .kws-cyl-nav:last-child').getAttribute('aria-disabled'));
  ok(r.live && r.ctl === 4 && c2a === 1 && c2b === 1 && d2 === 'true' && r.prevDis === 'true', 'C. two cards: a strip with two ends; Next stops at card 2 and is marked disabled; Previous marked disabled at card 1', JSON.stringify(r) + ` after next x2: ${c2a},${c2b}`);
  r = await mk(3); const c3 = [await step(1), await step(1), await step(1)]; ok(r.live && c3.join() === '1,2,0', 'C. three cards: loops round', c3.join());
  const vis3 = await p.evaluate(() => [...document.querySelectorAll('.x-test .kws-cyl-card')].map(c => c.style.opacity + ' ' + (c.style.transform.match(/rotateY\([^)]+\)/) || ['flat'])[0]).join(' | ')); log('   three cards at rest: ' + vis3);
  r = await mk(4); const c4 = [await step(1), await step(1), await step(1), await step(1)]; const v4 = await p.evaluate(() => [...document.querySelectorAll('.x-test .kws-cyl-card')].map(c => c.style.opacity).join(',')); ok(c4.join() === '1,2,3,0', 'C. four cards: loops round', c4.join() + ' opacities at rest ' + v4);
  r = await mk(20); const c20 = await step(23); const ctl = await p.evaluate(() => { const c = document.querySelector('.x-test .kws-cyl-ctl').getBoundingClientRect(), bs = [...document.querySelectorAll('.x-test .kws-cyl-ctl button')].map(x => x.getBoundingClientRect()); return { l: Math.round(bs[0].left), r: Math.round(bs[bs.length - 1].right), vw: innerWidth, w: Math.round(bs[3].width) }; });
  ok(c20 === 3, 'C. twenty cards: 23 presses of Next land on card 4', `${c20}; control row spans ${ctl.l} to ${ctl.r} of ${ctl.vw}px, dots ${ctl.w}px wide`);
  r = await mk(5, '{"loop":false,"start":4}'); const e5 = await cur(p, '.x-test'); const e5b = await step(2); const said = await p.evaluate(() => document.querySelector('.x-test .kws-cyl-sr').textContent);
  ok(e5 === 4 && e5b === 4 && r.nextDis === 'true', 'C. loop:false, start:4: starts on the last card, Next does nothing there and is marked disabled', `said "${said}"`);
  // ring counts
  const mr = n => p.evaluate(n => { document.querySelectorAll('.x-ring').forEach(e => e.remove()); const d = document.createElement('div'); d.className = 'kws-ring x-ring'; d.innerHTML = '<div class="kws-ring-stage" aria-hidden="true"></div><div class="kws-ring-lists"><div class="kws-ring-group"><h3 class="kws-ring-name">Group</h3><ul>' + Array.from({ length: n }, (_, i) => `<li>Item ${i + 1}</li>`).join('') + '</ul></div></div>'; document.body.prepend(d); KWS.ring.mount(d); const st = d.querySelector('.kws-ring-stage'); return { live: d.classList.contains('is-live'), cards: d.querySelectorAll('.kws-ring-card').length, stageDisplay: getComputedStyle(st).display, stageH: Math.round(st.getBoundingClientRect().height), js: document.documentElement.classList.contains('js') }; }, n);
  for (const n of [0, 1, 2, 3, 12, 80]) { const q = await mr(n); log(`   ring with ${n} lines: ${JSON.stringify(q)}`); }
  await p.evaluate(() => document.documentElement.classList.add('js')); const q2 = await mr(2); ok(!(q2.stageDisplay === 'block' && q2.cards === 0), 'C. ring with 2 lines on a page with html.js: no empty stage left holding space', JSON.stringify(q2));
  await p.evaluate(() => document.documentElement.classList.remove('js'));
  ok(p.errs.length === 0, 'C. no errors through the count tests', p.errs.join('|'));

  // ---- D. mount / unmount ten times, removal, leftovers
  const left = await p.evaluate(async () => { document.querySelectorAll('.x-test,.x-ring').forEach(e => e.remove()); const cyl = document.querySelector('.kws-cyl'), ring = document.querySelector('.kws-ring'); const snap = e => e.outerHTML.replace(/\s+/g, ' '); const offC = KWS.cylinder.mount(cyl), offR = KWS.ring.mount(ring); offC(); offR(); const c0 = snap(cyl), r0 = snap(ring);
    for (let i = 0; i < 10; i++) { const a = KWS.cylinder.mount(cyl, { start: i % 3 }), b = KWS.ring.mount(ring); cyl.querySelector('.kws-cyl-nav').click(); await new Promise(r => setTimeout(r, 60)); a(); b(); }
    const c1 = snap(cyl), r1 = snap(ring); KWS.cylinder.mount(cyl); KWS.ring.mount(ring);
    const diff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a === b ? '' : b.slice(Math.max(0, i - 60), i + 80); };
    return { cylSame: c0 === c1, ringSame: r0 === r1, cylDiff: diff(c0, c1), ringDiff: diff(r0, r1), stageStyle: ring.querySelector('.kws-ring-stage').getAttribute('style'), afterFirst: (() => { const m = c0.match(/<li[^>]*>/g).slice(0, 2).join(' '); return m; })() }; });
  ok(left.cylSame && left.ringSame, 'D. ten mounts and removals leave the markup exactly as after the first removal', (left.cylDiff || left.ringDiff).slice(0, 200));
  const pristine = await p.evaluate(() => { const ring = document.querySelector('.kws-ring'); const off = KWS.ring.mount(ring); off(); const st = ring.querySelector('.kws-ring-stage'); const cyl = document.querySelector('.kws-cyl'); const off2 = KWS.cylinder.mount(cyl); off2(); return { stageStyleAfterOff: st.getAttribute('style'), cardAttrs: [...cyl.querySelector('.kws-cyl-card').attributes].map(a => a.name + '=' + a.value).join(' '), rootAttrs: [...cyl.attributes].map(a => a.name).join(' ') }; });
  ok(!pristine.stageStyleAfterOff && !/style=/.test(pristine.cardAttrs.replace('style=', 'style=')) || pristine.cardAttrs.indexOf('style=') < 0 && !pristine.stageStyleAfterOff, 'D. the remover leaves no inline styles or attributes behind', JSON.stringify(pristine));
  await p.ctx.close();

  // ---- E. theme toggled mid-turn; two instances keyboard isolation
  const q = await open(b, DEMO, { w: 1280, h: 900 });
  await jump(q, '#how .kws-cyl'); await q.waitForTimeout(200);
  await q.evaluate(() => document.querySelector('#how .kws-cyl-nav:last-child').click()); await q.waitForTimeout(120); await q.click('#theme-toggle'); await settle(q, '#how .kws-cyl'); await q.waitForTimeout(300);
  const th = await q.evaluate(() => { const el = document.querySelector('#how .kws-cyl'), on = el.querySelector('.is-on'); return { theme: document.documentElement.dataset.theme, on: [...el.querySelectorAll('.kws-cyl-card')].indexOf(on), t: on.style.transform, bg: getComputedStyle(on).backgroundColor, dot: getComputedStyle(el.querySelector('.kws-cyl-dot[aria-current]'), '::before').backgroundColor }; });
  ok(th.theme === 'dark' && th.on === 1 && th.t === 'none', 'E. theme switched mid-turn: the turn finishes, colours follow', JSON.stringify(th));
  await q.focus('#how .kws-cyl-dot'); await q.keyboard.press('ArrowRight'); await settle(q, '#how .kws-cyl'); const two = [await cur(q, '#how .kws-cyl'), await cur(q, '#client .kws-cyl')];
  ok(two[0] === 2 && two[1] === 0, 'E. two cylinders on one page: keys move only the one with focus', two.join());
  await q.ctx.close();

  // ---- F. back-forward cache
  const f = await open(b, DEMO, { w: 390, h: 844, touch: true });
  await jump(f, '#how .kws-cyl', -60); await f.evaluate(() => document.querySelector('#how .kws-cyl-nav:last-child').click()); await settle(f, '#how .kws-cyl');
  await f.evaluate(() => { window.__mark = 1; window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
  await f.goto('http://localhost:8730/kit/depth/test/one-ring.html'); await f.waitForTimeout(400); await f.goBack(); await f.waitForTimeout(800);
  const bf = await f.evaluate(() => ({ persisted: window.__persisted, mark: window.__mark, live: document.querySelectorAll('.is-live').length, on: [...document.querySelectorAll('#how .kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), ctl: document.querySelectorAll('#how .kws-cyl-ctl').length, hubs: document.querySelectorAll('#included .kws-ring-hub').length }));
  await f.evaluate(() => document.querySelector('#how .kws-cyl-nav:last-child').click()); await settle(f, '#how .kws-cyl'); const after = await cur(f, '#how .kws-cyl');
  await jump(f, '#included .kws-ring', -300); await f.waitForTimeout(500); const h0 = await f.evaluate(() => document.querySelector('#included .kws-ring-hub').style.transform); await f.evaluate(() => scrollBy(0, 200)); await f.waitForTimeout(700); const h1 = await f.evaluate(() => document.querySelector('#included .kws-ring-hub').style.transform);
  ok(bf.live === 4 && bf.ctl === 1 && bf.hubs === 1 && after === (bf.on + 1) % 5 && h0 !== h1, `F. back to the page (${bf.persisted ? 'restored from the back-forward cache' : 'reloaded, not from the cache: ' + (bf.mark ? 'same document' : 'new document')}): one set of controls, one hub, both still work`, JSON.stringify(bf) + ` next > ${after}`);
  await f.ctx.close();
  await b.close();
})();
