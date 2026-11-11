// The carousel ring's contract, checked by script: node test/ring.js   (needs the kit server on :8730)
const { engine, DEMO, BARE, RING, ok, note, open, jump, ring, finger, line, done } = require('./lib');
const chromium = engine('chromium');
const STEP = 360 / 30;
const onCard = a => Math.abs(a / STEP - Math.round(a / STEP)) < .01;
const rest = async (p, sel = RING, ms = 2200) => { await p.waitForTimeout(ms); return ring(p, sel); };
const frames = p => p.evaluate(() => window.__raf);

(async () => {
  const b = await chromium.launch();

  // ---- 1. what it is made of
  let p = await open(b, DEMO); await jump(p, RING, -100); let s = await rest(p, RING, 1500);
  let m = await p.evaluate(sel => { const el = document.querySelector(sel), st = el.querySelector('.kws-ring-stage'), lists = [...el.querySelectorAll('.kws-ring-group')];
    return { hidden: st.getAttribute('aria-hidden'), focusable: st.querySelectorAll('a,button,input,[tabindex]').length, cards: st.querySelectorAll('.kws-ring-card').length, cardText: [...st.querySelectorAll('.kws-ring-card')].map(c => c.textContent).join(''), lines: el.querySelectorAll('li').length,
      listText: lists.map(g => g.querySelector('.kws-ring-name').textContent + ' ' + g.querySelector('.kws-ring-price').textContent + ' ' + g.querySelectorAll('li').length).join(' | '), names: lists.map(g => g.querySelector('.kws-ring-name').textContent), short: [...el.querySelectorAll('li')].map(li => li.dataset.short || li.textContent.trim()),
      tabs: [...st.querySelectorAll('.kws-ring-card')].map(c => c.style.getPropertyValue('--k')).join(''), roles: [...el.querySelectorAll('.kws-ring-lists [role]:not(ul[role=list]),.kws-ring-lists [aria-hidden],.kws-ring-lists [style]')].length }; }, RING);
  ok(m.hidden === 'true' && m.focusable === 0, 'the stage is aria-hidden and holds nothing that can take focus');
  ok(m.cards === 30 && m.lines === 30 && m.cardText === '', 'thirty lines, thirty cards; the cards round the ring carry no words at all (nothing to overlap, clip or mirror)');
  ok(m.listText === 'One-page $1,000 7 | Starter $2,000 7 | Business $4,000 8 | Commerce $8,000 8' && m.roles === 0, 'the lists are untouched (no roles, hiding or styles added): four packages, their fixed prices and every line', m.listText);
  ok(m.tabs === '0'.repeat(7) + '1'.repeat(7) + '2'.repeat(8) + '3'.repeat(8), "each list's cards share one of four tab places, so a package reads as a section of the file");
  const idx = m.short.indexOf(s.up);
  ok(idx > -1 && s.tab === m.names[idx < 7 ? 0 : idx < 14 ? 1 : idx < 22 ? 2 : 3] && s.words === '1', 'one card stands up to be read: a line from the lists, with its package on the tab', `"${s.tab}: ${s.up}"`);
  ok(/translateZ\(0px\) rotateX\(0deg\) rotateY\(0deg\) translateZ\(0px\) rotateY\(0deg\)/.test(s.upT.replace(/-0/g, '0')) && /scale\(0\.5\)$/.test(s.upT), 'at rest the standing card is flat-on: no rotation and no depth left in its transform', s.upT.replace(/perspective\([^)]+\) /, ''));
  m = await p.evaluate(sel => { const el = document.querySelector(sel), st = el.querySelector('.kws-ring-stage').getBoundingClientRect(), hub = el.querySelector('.kws-ring-hub').getBoundingClientRect(), up = [...el.querySelectorAll('.kws-ring-read')].filter(r => +r.style.opacity > .99)[0].getBoundingClientRect(), lists = el.querySelector('.kws-ring-lists').getBoundingClientRect(), R = parseFloat(el.querySelector('.kws-ring-stage').style.fontSize);
    return { off: Math.round((up.left + up.right) / 2 - hub.left), R, stage: [Math.round(st.left), Math.round(st.top), Math.round(st.width), Math.round(st.height)], up: [Math.round(up.left), Math.round(up.width), Math.round(up.height)], gap: Math.round(lists.left - (hub.left + R * .92)), lists: Math.round(lists.height), mid: Math.round(st.top + st.height / 2 - innerHeight / 2), sticky: getComputedStyle(el.querySelector('.kws-ring-stage')).position }; }, RING);
  ok(onCard(s.ang) && m.off === 0, 'it rests on a card, and the standing card is dead centre on the ring', `angle ${s.ang}, offset ${m.off}px`);
  ok(m.R >= 420 && m.stage[0] <= 0 && m.gap >= 0 && m.up[0] >= 0, '1280px: the ring is large, runs off the left edge of the window and stops short of the lists', `radius ${m.R}px (about ${Math.round(m.R * 1.56)}px across), stage ${m.stage[2]}x${m.stage[3]} from x=${m.stage[0]}, standing card ${m.up[1]}x${m.up[2]}`);
  const centre = () => p.evaluate(sel => { const st = document.querySelector(sel + ' .kws-ring-stage').getBoundingClientRect(); return Math.round(st.top + st.height / 2 - innerHeight / 2); }, RING);
  const c1 = await centre(); await p.evaluate(() => scrollBy(0, 110)); await p.waitForTimeout(200); const c2 = await centre();
  ok(Math.abs(c1) <= 2 && Math.abs(c2) <= 2, 'beside the lists the stage sticks in the middle of the window while they scroll past', `${c1}px and, 110px further on, ${c2}px off centre`);
  await p.ctx.close();

  // ---- 2. it turns with the page, and settles on a card
  p = await open(b, DEMO); await jump(p, RING, -400); let a0 = (await rest(p, RING, 1200)).ang, f0 = await frames(p);
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 25); await p.waitForTimeout(30); }
  let mid = await ring(p); s = await rest(p);
  ok(Math.abs(s.ang - a0) > 20 && Math.abs(Math.abs(s.ang - a0) - 30) <= STEP / 2 + .1 && await frames(p) > f0, 'scrolling 300px turns it about 30 degrees (0.1 degree a pixel)', `${(s.ang - a0).toFixed(1)} degrees`);
  ok(!onCard(mid.ang) && onCard(s.ang), 'when the scrolling stops it eases to the nearest card (at most half a step)', `${mid.ang.toFixed(2)} in flight, ${s.ang} at rest`);
  f0 = await frames(p); await p.waitForTimeout(1500);
  ok(await frames(p) === f0, 'no animation frames while it rests');
  // off screen: nothing runs and the cards are not kept
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600); f0 = await frames(p);
  await p.mouse.wheel(0, 60); await p.waitForTimeout(500);
  ok(await frames(p) === f0 && await p.evaluate(sel => document.querySelector(sel + ' .kws-ring-hub').style.display, RING) === 'none', 'off screen it asks for no frames and its cards are not kept as layers');
  await jump(p, RING, -100); await p.waitForTimeout(80); let j = await ring(p);
  ok(onCard(j.ang), 'coming back on screen it is already on a card: no catching up to watch', `angle ${j.ang}`);
  // the wheel is the page's; the cursor
  let y0 = await p.evaluate(() => scrollY); const bx = await p.locator(RING + ' .kws-ring-stage').boundingBox();
  await p.mouse.move(Math.max(40, bx.x + bx.width / 2), bx.y + bx.height / 2); await p.mouse.wheel(0, 200); await p.waitForTimeout(300);
  ok(await p.evaluate(() => scrollY) - y0 > 150, 'the mouse wheel over the ring scrolls the page');
  await p.ctx.close();

  // ---- 3. drag
  p = await open(b, DEMO); await jump(p, RING, -100); a0 = (await rest(p, RING, 1500)).ang;
  let box = await p.locator(RING + ' .kws-ring-stage').boundingBox(); let cx = Math.max(300, box.x + box.width * .6), cy = box.y + box.height * .8;
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(cx - i * 12, cy); await p.waitForTimeout(16); }
  mid = await ring(p); await p.mouse.up(); s = await rest(p);
  ok(mid.ang < a0 - 8 && s.ang <= mid.ang && onCard(s.ang), 'a sideways drag turns it, it coasts a little and settles on a card', `${a0} > ${mid.ang.toFixed(1)} > ${s.ang}`);
  // drag, hold still for a second, let go: no fling
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(cx - i * 25, cy); await p.waitForTimeout(8); }
  await p.waitForTimeout(1100); f0 = await frames(p); await p.waitForTimeout(600); const heldFrames = await frames(p) - f0;
  mid = await ring(p); await p.mouse.up(); s = await rest(p);
  ok(Math.abs(s.ang - mid.ang) <= STEP / 2 + .1 && onCard(s.ang), 'a quick drag held still for well over a second, then let go, only settles on the nearest card: no fling from the old speed', `moved ${(s.ang - mid.ang).toFixed(2)} degrees after release`);
  ok(heldFrames === 0, 'once the card at the front is up, a pointer held still on the ring asks for no frames', heldFrames + ' frames in 0.6s');
  // a press that is not a drag does nothing
  a0 = s.ang; await p.mouse.click(cx, cy); s = await rest(p, RING, 600);
  ok(s.ang === a0, 'a plain click on it changes nothing');
  await p.ctx.close();

  // ---- 4. hand-over: two cards never read at once, and nothing stands half-way at rest
  p = await open(b, DEMO); await jump(p, RING, -100); await rest(p, RING, 1200);
  const seen = await p.evaluate(sel => new Promise(res => { const el = document.querySelector(sel), out = { both: 0, n: 0, maxUp: 0, minP: 1 }; let y = scrollY, k = 0;
    const loop = () => { const rs = [...el.querySelectorAll('.kws-ring-read')]; const words = rs.filter(r => +r.style.opacity > 0 && +r.lastChild.style.opacity > 0).length; out.n++; if (words > 1) out.both++; out.maxUp = Math.max(out.maxUp, rs.filter(r => +r.style.opacity > 0).length);
      if (k++ < 90) { scrollTo(0, y += 4); requestAnimationFrame(loop); } else res(out); }; requestAnimationFrame(loop); }), RING);
  ok(seen.both === 0 && seen.n > 60, 'through a slow scroll past a dozen cards, sampled every frame: never two cards with words showing at once', `${seen.n} frames, at most ${seen.maxUp} cards lifted`);
  s = await rest(p);
  m = await p.evaluate(sel => [...document.querySelectorAll(sel + ' .kws-ring-read')].map(r => r.style.opacity + '/' + r.lastChild.style.opacity).sort().join(' '), RING);
  ok(m === '0/0 1/1', 'at rest exactly one card is up, with its words; the other is fully away', m);
  await p.ctx.close();

  // ---- 5. phone: a designed size, not a shrunk one; the page scrolls, the ring turns sideways
  p = await open(b, DEMO, { w: 390, h: 844, touch: true }); await jump(p, RING, -70); s = await rest(p, RING, 1500);
  m = await p.evaluate(sel => { const el = document.querySelector(sel), st = el.querySelector('.kws-ring-stage').getBoundingClientRect(), up = [...el.querySelectorAll('.kws-ring-read')].filter(r => +r.style.opacity > .99)[0], ur = up.getBoundingClientRect(), R = parseFloat(el.querySelector('.kws-ring-stage').style.fontSize);
    return { R, stage: [Math.round(st.left), Math.round(st.width), Math.round(st.height)], up: Math.round(ur.width), words: +(parseFloat(getComputedStyle(up.lastChild).fontSize) * .5).toFixed(1), tab: +(parseFloat(getComputedStyle(up.firstChild).fontSize) * .5).toFixed(1), sx: document.documentElement.scrollWidth - innerWidth }; }, RING);
  ok(m.stage[0] === 0 && m.stage[1] === 390 && m.R * 1.56 > 390 && m.sx <= 0, '390px: the stage runs edge to edge and the ring is wider than the screen, so the front arc is large', `radius ${m.R}px, stage ${m.stage[1]}x${m.stage[2]}`);
  ok(m.up >= 234 && m.words >= 17 && m.tab >= 12, '390px: the standing card is at least 60% of the width, its words 17px or more, its tab 12px or more (as drawn, after scaling)', `${m.up}px wide, words ${m.words}px, tab ${m.tab}px`);
  box = await p.locator(RING + ' .kws-ring-stage').boundingBox(); let x = 195, y = box.y + box.height * .75;
  y0 = await p.evaluate(() => scrollY); a0 = s.ang;
  await finger(p, line(x + 90, y, x - 110, y + 6, 10)); mid = await ring(p); s = await rest(p, RING, 3000);
  ok(s.ang < a0 - 10 && Math.abs(await p.evaluate(() => scrollY) - y0) < 2 && onCard(s.ang), 'a sideways swipe turns the ring and the page does not move', `${(s.ang - a0).toFixed(0)} degrees; page moved ${await p.evaluate(() => scrollY) - y0}px; at rest on ${s.ang}`);
  y0 = await p.evaluate(() => scrollY); await finger(p, line(x, y, x + 5, y - 230, 10)); await p.waitForTimeout(600);
  ok(await p.evaluate(() => scrollY) - y0 > 150, 'a vertical swipe on the ring scrolls the page', `${await p.evaluate(() => scrollY) - y0}px`);
  m = await p.evaluate(sel => getComputedStyle(document.querySelector(sel + ' .kws-ring-stage')).touchAction, RING);
  ok(/pan-y/.test(m) && /pinch-zoom/.test(m), 'touch-action leaves vertical scrolling and pinch-zoom to the browser', m);
  await p.ctx.close();

  // ---- 6. reduced motion and paused motion: a still ring
  for (const mode of ['reduced motion', 'motion paused']) {
    p = await open(b, DEMO, { w: 390, h: 844, touch: true, rm: mode === 'reduced motion' }); if (mode !== 'reduced motion') await p.click('#demo-motion');
    await jump(p, RING, -70); await p.waitForTimeout(600); const f = await frames(p), before = await ring(p);
    await p.evaluate(() => scrollBy(0, 120)); await p.waitForTimeout(200); await p.evaluate(() => scrollBy(0, -120)); await p.waitForTimeout(200);
    box = await p.locator(RING + ' .kws-ring-stage').boundingBox();
    await finger(p, line(280, box.y + 220, 90, box.y + 224, 8)); await p.waitForTimeout(400);
    const after = await ring(p);
    ok(await frames(p) === f && before.all === after.all && after.up && after.words === '1', `${mode}: a still ring with one card stood up to read; scrolling and dragging change nothing and no frames are asked for`, `"${after.up}"`);
    if (mode !== 'reduced motion') {
      await p.click('#demo-motion'); await p.evaluate(() => scrollBy(0, 4)); await p.waitForTimeout(60); const now = await ring(p);
      ok(Math.abs(now.ang - before.ang) < 1.5, 'motion switched back on: it carries on from where it stood, with no jump', `${before.ang} then ${now.ang.toFixed(2)}`);
    }
    await p.ctx.close();
  }

  // motion paused in mid-turn: it stops where it is and stops asking for frames
  p = await open(b, DEMO); await jump(p, RING, -300); await p.waitForTimeout(800);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 40); await p.waitForTimeout(20); }
  await p.evaluate(() => document.documentElement.setAttribute('data-motion', 'off')); await p.waitForTimeout(150);
  f0 = await frames(p); const stopped = await ring(p); await p.waitForTimeout(900); const later = await ring(p);
  ok(await frames(p) === f0 && stopped.all === later.all, 'motion paused in mid-turn: it stops where it is and asks for no more frames', `${await frames(p) - f0} frames in 0.9s`);
  await p.ctx.close();

  // ---- 7. resizing does not turn it; mounting, removing, too few lines
  p = await open(b, DEMO, { w: 1280, h: 900 }); await jump(p, RING, -100); await p.evaluate(() => scrollBy(0, 300)); s = await rest(p);
  await p.setViewportSize({ width: 1262, height: 900 }); await p.waitForTimeout(1500); let s2 = await ring(p);
  ok(Math.abs(s2.ang - s.ang) < .01, 'a resize while the stage is stuck does not turn it', `${s.ang} then ${s2.ang}`);
  for (let w = 1262; w > 700; w -= 140) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(60); }
  await p.waitForTimeout(800);
  ok(p.errs.length === 0 && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'resized step by step across the breakpoints: no errors, no sideways scroll', p.errs.join());
  m = await p.evaluate(sel => { const el = document.querySelector(sel), st = el.querySelector('.kws-ring-stage'), off = KWS.ring.mount(el), same = KWS.ring.mount(el) === off; off();
    const left = { cls: el.className, kids: st.children.length, attrs: st.getAttributeNames().join('+') }; const off2 = KWS.ring.mount(el, { speed: .3 }); const again = st.querySelectorAll('.kws-ring-card').length;
    // a ring with too few lines gives its space back
    const few = document.createElement('div'); few.className = 'kws-ring'; few.innerHTML = '<div class="kws-ring-stage" aria-hidden="true"></div><div class="kws-ring-lists"><div class="kws-ring-group"><h3 class="kws-ring-name">A</h3><ul><li>one</li><li>two</li></ul></div></div>'; el.after(few);
    const offFew = KWS.ring.mount(few), fs = few.querySelector('.kws-ring-stage'), r = { live: few.classList.contains('is-live'), shown: getComputedStyle(fs).display, h: fs.offsetHeight }; offFew(); r.after = fs.getAttribute('style'); few.remove();
    // a ring with no stage in its markup stays a list; a single plain list with a stage is enough
    const bare = document.createElement('div'); bare.className = 'kws-ring'; bare.innerHTML = '<ul>' + '<li>line</li>'.repeat(12) + '</ul>'; el.after(bare); KWS.ring.mount(bare)(); const made = bare.innerHTML === '<ul>' + '<li>line</li>'.repeat(12) + '</ul>' && bare.className === 'kws-ring';
    bare.innerHTML = '<div class="kws-ring-stage" aria-hidden="true"></div><ul>' + '<li>line</li>'.repeat(12) + '</ul>'; const offB = KWS.ring.mount(bare), gone = bare.querySelectorAll('.kws-ring-card').length === 12 && [...bare.querySelectorAll('.kws-ring-read b')].every(t => t.textContent === ''); offB(); bare.remove();
    return { same, left, again, r, made, gone }; }, RING);
  ok(m.same && m.left.cls === 'kws-ring' && m.left.kids === 0 && m.left.attrs === 'class+aria-hidden' && m.again === 30, 'mounting twice returns the same remover; it takes away its cards, the class and the inline style, and it can be mounted again', JSON.stringify(m.left));
  ok(!m.r.live && m.r.shown === 'none' && m.r.h === 0 && m.r.after === null, 'a ring with fewer than three lines never starts and keeps no empty space for one', JSON.stringify(m.r));
  ok(m.made && m.gone, 'markup with no stage stays a plain list, untouched; one plain list with a stage is enough for a ring (its cards have blank tabs)');
  ok(p.errs.length === 0, 'no errors through all of that', p.errs.join());
  await p.ctx.close();

  // ---- 8. fallbacks
  p = await open(b, DEMO, { w: 360, h: 760, touch: true });
  m = await p.evaluate(sel => { const el = document.querySelector(sel), st = el.querySelector('.kws-ring-stage'); return { d: getComputedStyle(st).display, lists: el.querySelector('.kws-ring-lists').getBoundingClientRect().width, cols: getComputedStyle(el.querySelector('.kws-ring-lists')).gridTemplateColumns.split(' ').length }; }, RING);
  f0 = await frames(p); await jump(p, RING, -200); await p.evaluate(() => scrollBy(0, 300)); await p.waitForTimeout(500);
  ok(m.d === 'none' && m.cols === 2 && await frames(p) === f0, 'under 380px the ring gives way to its lists, and asks for no frames', JSON.stringify(m));
  await p.ctx.close();
  p = await open(b, DEMO, { js: false, w: 1280 });
  m = await p.evaluate(sel => { const el = document.querySelector(sel); return { d: getComputedStyle(el.querySelector('.kws-ring-stage')).display, cols: getComputedStyle(el.querySelector('.kws-ring-lists')).gridTemplateColumns.split(' ').length, w: Math.round(el.querySelector('.kws-ring-lists').getBoundingClientRect().width), li: [...el.querySelectorAll('li')].every(li => li.getBoundingClientRect().height > 10) }; }, RING);
  ok(m.d === 'none' && m.cols === 4 && m.w > 1100 && m.li, 'script off: the four lists side by side across the full width, no stage and no gap', JSON.stringify(m));
  await p.ctx.close();

  // ---- 9. the bare client page, and long lines
  p = await open(b, BARE, { w: 1280 }); await jump(p, '.kws-ring', -100); s = await rest(p, '.kws-ring', 1500);
  ok(p.errs.length === 0 && s.n === 30 && s.up && onCard(s.ang), 'bare page (no site stylesheet): the ring runs, with one card up', `"${s.tab}: ${s.up}"`);
  m = await p.evaluate(() => { const el = document.querySelector('.kws-ring'), li = el.querySelector('li'), L = 'Donaudampfschifffahrtsgesellschaftskapitaensmuetze'; KWS.ring.mount(el)(); li.textContent = L + ' ' + L + ' and then a very long line that goes on and on, far past what one small index card can hold, to see what the card does with it'; KWS.ring.mount(el);
    const g = li.closest('.kws-ring-group').getBoundingClientRect(), lr = li.getBoundingClientRect(); return { listOut: Math.round(lr.right - g.right), sx: document.documentElement.scrollWidth - innerWidth }; });
  await p.evaluate(() => scrollTo(0, 0)); await jump(p, '.kws-ring', -100); await rest(p, '.kws-ring', 800);
  const out = await p.evaluate(() => { const el = document.querySelector('.kws-ring'), rs = [...el.querySelectorAll('.kws-ring-read')]; return rs.map(r => { const w = r.lastChild, a = r.getBoundingClientRect(), c = w.getBoundingClientRect(); return [Math.round(c.right - a.right), Math.round(c.bottom - a.bottom), w.scrollHeight > w.clientHeight]; }); });
  ok(m.listOut <= 0 && m.sx <= 0 && out.every(o => o[0] <= 0 && o[1] <= 0), 'a 50-letter word wraps inside its list; a line too long for the card is cut at the card, not spilled', JSON.stringify(out));
  await p.ctx.close();

  await b.close();
  process.exit(done() ? 1 : 0);
})();
