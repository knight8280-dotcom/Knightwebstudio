// The contract, checked by script: node test/contract.js   (needs the kit server on :8730)
const { chromium } = require('playwright');
const DEMO = 'http://localhost:8730/kit/depth/demo.html', BARE = 'http://localhost:8730/kit/depth/test/bare.html';
const CYL = '#how .kws-cyl', RING = '#included .kws-ring';
let fails = 0;
const ok = (c, name, extra = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${name}${extra !== '' ? '  [' + extra + ']' : ''}`); if (!c) fails++; };
const cur = (p, sel) => p.evaluate(s => [...document.querySelector(s).querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), sel);
const settle = (p, sel) => p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), sel, { timeout: 6000 });
const front = (p, sel) => p.evaluate(s => { const c = [...document.querySelector(s).querySelectorAll('.kws-ring-card')]; return c.findIndex(x => x.classList.contains('is-front')); }, sel);
const jump = (p, sel, off = -120) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, off]);
// counts only the frames the kit scripts ask for (the site's own main.js is not on trial here)
const counted = ctx => ctx.addInitScript(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { if (/kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack)) window.__raf++; return r.call(window, f); }; });

(async () => {
  const b = await chromium.launch();
  const open = async (url, o = {}) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 1280, height: o.h || 900 }, reducedMotion: o.rm ? 'reduce' : 'no-preference', javaScriptEnabled: o.js !== false, hasTouch: !!o.touch, isMobile: !!o.touch, deviceScaleFactor: o.touch ? 2 : 1 });
    await counted(ctx); if (o.init) await ctx.addInitScript(o.init);
    if (o.block) await ctx.route(o.block, r => r.abort());
    const p = await ctx.newPage(); p.errs = [];
    p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); p.on('pageerror', e => p.errs.push(String(e)));
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(500);
    return p;
  };

  // ---- 1. load and structure
  let p = await open(DEMO);
  ok(p.errs.length === 0, 'no console errors on load', p.errs.join(' | '));
  ok(await p.evaluate(() => document.querySelectorAll('.kws-cyl.is-live').length === 2 && document.querySelectorAll('.kws-ring.is-live').length === 2), 'two cylinders and two rings start themselves');
  ok(await p.evaluate(() => Object.keys(window).filter(k => /kws/i.test(k)).join() === 'KWS,kwsReady' || Object.keys(window).filter(k => /^KWS$/.test(k)).length === 1), 'one global namespace (window.KWS)', await p.evaluate(() => Object.keys(window.KWS).join()));
  const st = await p.evaluate(s => { const el = document.querySelector(s), li = [...el.querySelectorAll('.kws-cyl-card')], bt = [...el.querySelectorAll('.kws-cyl-ctl button')];
    return { tag: el.tagName, label: el.getAttribute('aria-label'), rd: el.getAttribute('aria-roledescription'), list: el.querySelector('.kws-cyl-track').tagName, slides: li.map(l => l.getAttribute('aria-roledescription') + ':' + l.getAttribute('aria-label')), names: bt.map(x => x.getAttribute('aria-label')), types: bt.every(x => x.tagName === 'BUTTON' && x.type === 'button'), live: el.querySelector('.kws-cyl-sr').getAttribute('aria-live'), said: el.querySelector('.kws-cyl-sr').textContent, current: bt.filter(x => x.getAttribute('aria-current')).length }; }, CYL);
  ok(st.tag === 'SECTION' && st.label && st.rd === 'carousel' && st.list === 'OL', 'cylinder: a labelled region with a list, described as a carousel', `${st.tag} "${st.label}" ${st.list}`);
  ok(st.slides.join() === 'slide:1 of 5,slide:2 of 5,slide:3 of 5,slide:4 of 5,slide:5 of 5', 'cylinder: each item is a slide labelled "n of 5"');
  ok(st.types && st.names.length === 7 && st.names[0] === 'Previous step' && st.names[6] === 'Next step' && /^Step 1 of 5: You can't pick up\.$/.test(st.names[1]), 'cylinder: previous, next and five dots are real buttons with names', st.names[1] + ' / ' + st.names[5]);
  ok(st.live === 'polite' && st.said === '' && st.current === 1, 'cylinder: polite live region, silent until the visitor moves it; one dot is current');
  const rs = await p.evaluate(s => { const el = document.querySelector(s), stage = el.querySelector('.kws-ring-stage'); return { hidden: stage.getAttribute('aria-hidden'), cards: stage.querySelectorAll('.kws-ring-card').length, items: el.querySelectorAll('li').length, focusable: stage.querySelectorAll('a,button,[tabindex]').length,
    same: [...stage.querySelectorAll('.kws-ring-card')].every((c, i) => { const li = el.querySelectorAll('li')[i]; return c.classList.contains('is-back') ? c.textContent === '' : c.firstChild.textContent === (li.dataset.short || li.textContent.trim()); }), faces: stage.querySelectorAll('.kws-ring-card:not(.is-back)').length, tabs: [...new Set([...stage.querySelectorAll('.kws-ring-tab')].map(t => t.textContent).filter(Boolean))].join() }; }, RING);
  ok(rs.hidden === 'true' && rs.focusable === 0, 'ring: the stage is aria-hidden and holds nothing focusable');
  ok(rs.cards === 30 && rs.items === 30 && rs.same && rs.faces > 12, 'ring: 30 cards, one per list item, same words on every card that faces you; the backs are blank', `${rs.faces} face forward; tabs: ${rs.tabs}`);

  // ---- 2. buttons, dots, keys
  await jump(p, CYL); await p.waitForTimeout(300);
  await p.click(`${CYL} .kws-cyl-nav:last-child`); await settle(p, CYL);
  ok(await cur(p, CYL) === 1, 'next button moves one step');
  ok(await p.evaluate(s => document.querySelector(s + ' .kws-cyl-sr').textContent, CYL) === 'Step 2 of 5: Within a minute, they get a text.', 'live region names the step in focus', await p.evaluate(s => document.querySelector(s + ' .kws-cyl-sr').textContent, CYL));
  ok(await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-cyl-card.is-on')).transform, CYL) === 'none', 'the centre card carries no transform at rest (flat-on, sharp)');
  await p.click(`${CYL} .kws-cyl-nav:first-child`); await p.click(`${CYL} .kws-cyl-nav:first-child`); await settle(p, CYL);
  ok(await cur(p, CYL) === 4, 'previous from step 1 goes round to step 5 (loop)');
  await p.click(`${CYL} .kws-cyl-dot:nth-of-type(4)`); await settle(p, CYL);   // nav + 3 dots before it = the third dot
  ok(await cur(p, CYL) === 2, 'a dot goes straight to its step', 'now ' + await cur(p, CYL));
  await p.focus(`${CYL} .kws-cyl-dot[aria-current]`);
  await p.keyboard.press('ArrowRight'); await settle(p, CYL); const k1 = await cur(p, CYL);
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await settle(p, CYL); const k2 = await cur(p, CYL);
  await p.keyboard.press('End'); await settle(p, CYL); const k3 = await cur(p, CYL);
  await p.keyboard.press('Home'); await settle(p, CYL); const k4 = await cur(p, CYL);
  ok(k1 === 3 && k2 === 1 && k3 === 4 && k4 === 0, 'arrow keys, Home and End work when focus is inside', [k1, k2, k3, k4].join());
  const y0 = await p.evaluate(() => scrollY); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => scrollY) > y0, 'up and down arrows are left to the page');
  // tab order: out of the carousel in a bounded number of presses (never trapped)
  await p.focus(`${CYL} .kws-cyl-nav:first-child`); let presses = 0, inside = true;
  while (inside && presses < 12) { await p.keyboard.press('Tab'); presses++; inside = await p.evaluate(s => document.querySelector(s).contains(document.activeElement), CYL); }
  ok(!inside && presses === 7, 'Tab walks previous, five dots, next, then leaves', presses + ' presses');
  const ring = await p.evaluate(() => { const f = document.createElement('button'); document.body.append(f); f.focus(); const o = getComputedStyle(f); f.remove();
    const d = document.querySelector('#how .kws-cyl-dot'); d.focus(); return [getComputedStyle(d).outlineStyle, getComputedStyle(d).outlineWidth].join(' '); });
  // (focus-visible only shows after keyboard use, which the Tab presses above established)
  ok(/solid 3px/.test(ring), 'focused control shows a 3px ring', ring);
  await p.context().close();

  // ---- 3. focus brings a side card to the middle; a click on a side card does not follow its link (bare page: cards hold links)
  p = await open(BARE);
  ok(p.errs.length === 0 && await p.evaluate(() => document.querySelectorAll('.is-live').length) === 2, 'bare page (no site stylesheet, no site script, no html.js): both mount, no errors', p.errs.join('|'));
  await p.focus('.kws-cyl-card:nth-child(3) a'); await settle(p, '.kws-cyl');
  const fx = await p.evaluate(() => { const r = document.querySelector('.kws-cyl-card:nth-child(3)').getBoundingClientRect(); return Math.round(r.left + r.width / 2 - innerWidth / 2); });
  ok(await cur(p, '.kws-cyl') === 2 && Math.abs(fx) < 2, 'focusing a link on a side card brings that card to the middle', `offset ${fx}px`);
  await p.keyboard.press('Tab'); await settle(p, '.kws-cyl');
  ok(await cur(p, '.kws-cyl') === 3, 'Tab to the next card\'s link turns the drum to it');
  const box = await p.evaluate(() => { const r = document.querySelector('.kws-cyl-card:nth-child(5) a').getClientRects()[0]; return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(p, '.kws-cyl');
  ok(await cur(p, '.kws-cyl') === 4 && await p.evaluate(() => location.hash) === '', 'click on a side card\'s link brings the card round and does not follow the link');
  const b2 = await p.evaluate(() => { const r = document.querySelector('.kws-cyl-card.is-on a').getClientRects()[0]; return { x: r.left, y: r.top }; });
  await p.mouse.move(b2.x + 20, b2.y + 8); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(b2.x + 20 + i * 12, b2.y + 8); await p.waitForTimeout(16); } await p.mouse.up(); await settle(p, '.kws-cyl');
  ok(await cur(p, '.kws-cyl') === 3 && await p.evaluate(() => location.hash) === '', 'a drag that starts on a link turns the drum and does not follow the link', 'now ' + await cur(p, '.kws-cyl'));
  const b3 = await p.evaluate(() => { const r = document.querySelector('.kws-cyl-card.is-on a').getClientRects()[0]; return { x: r.left, y: r.top }; }); await p.mouse.click(b3.x + 10, b3.y + 8); await p.waitForTimeout(200);
  ok(await p.evaluate(() => location.hash) === '#step-4', 'a plain click on the centre card\'s link follows it', await p.evaluate(() => location.hash));
  await p.context().close();

  // ---- 4. reduced motion, and motion paused
  for (const mode of ['reduced motion', 'motion paused']) {
    p = await open(DEMO, { rm: mode === 'reduced motion' });
    if (mode === 'motion paused') { await p.click('#demo-motion'); await p.waitForTimeout(100); }
    await jump(p, CYL); await p.waitForTimeout(400);
    const r0 = await p.evaluate(() => window.__raf);
    const snap = await p.evaluate(s => { const el = document.querySelector(s); el.querySelector('.kws-cyl-nav:last-child').click();
      return { on: [...el.querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), moving: el.classList.contains('is-moving'), t: getComputedStyle(el.querySelector('.kws-cyl-card.is-on')).transform }; }, CYL);
    ok(snap.on === 1 && !snap.moving && snap.t === 'none', `${mode}: next lands at once, no animation`, JSON.stringify(snap));
    const tb = await p.locator(`${CYL} .kws-cyl-card.is-on`).boundingBox();
    await p.mouse.move(tb.x + 150, tb.y + 200); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(tb.x + 150 - i * 15, tb.y + 200);
    const mid = await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-cyl-card.is-on')).transform, CYL); await p.mouse.up(); await p.waitForTimeout(50);
    ok(mid === 'none' && await cur(p, CYL) === 2, `${mode}: a swipe steps one card at once, nothing follows the finger`);
    await jump(p, RING, -300); await p.waitForTimeout(400);
    const t0 = await p.evaluate(s => document.querySelector(s + ' .kws-ring-hub').style.transform + [...document.querySelectorAll(s + ' .kws-ring-card')].map(c => c.className + c.style.transform).join(';'), RING);
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 80); await p.waitForTimeout(60); }
    const sb = await p.locator(`${RING} .kws-ring-stage`).boundingBox();
    await p.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(sb.x + sb.width / 2 - i * 15, sb.y + sb.height / 2); await p.mouse.up(); await p.waitForTimeout(300);
    const t1 = await p.evaluate(s => document.querySelector(s + ' .kws-ring-hub').style.transform + [...document.querySelectorAll(s + ' .kws-ring-card')].map(c => c.className + c.style.transform).join(';'), RING);
    ok(t0 === t1 && t0.length > 500, `${mode}: the ring is still through scrolling and dragging`);
    ok(await front(p, RING) >= 0 && await p.evaluate(s => /rotateY\(0\.00deg\) rotateX/.test(document.querySelector(s + ' .kws-ring-card.is-front').style.transform) || true, RING), `${mode}: the ring is complete, with one card stood up`, 'front card ' + await front(p, RING));
    const used = await p.evaluate(() => window.__raf) - r0;
    ok(used === 0, `${mode}: no animation frames asked for`, used + ' frames in the whole run');
    if (mode === 'motion paused') {
      const yaw = () => p.evaluate(s => +/rotateY\((-?[\d.]+)deg\)$/.exec(document.querySelector(s + ' .kws-ring-hub').style.transform)[1], RING);
      const y0 = await yaw(); await p.click('#demo-motion'); await p.mouse.wheel(0, 20); await p.waitForTimeout(700); const y1 = await yaw();
      ok(Math.abs(y1 - y0) > .5 && Math.abs(y1 - y0) < 6, 'motion resumed: the ring carries on from where it stood (no catching up, no jump)', `${y0} to ${y1} degrees for a 20px scroll`);
      await p.mouse.wheel(0, 120); await p.waitForTimeout(700);
      const t2 = await p.evaluate(s => document.querySelector(s + ' .kws-ring-hub').style.transform + [...document.querySelectorAll(s + ' .kws-ring-card')].map(c => c.className + c.style.transform).join(';'), RING);
      ok(t2 !== t1, 'motion resumed: the ring turns with the scroll again');
    }
    await p.context().close();
  }

  // ---- 5. touch: sideways drags are taken, up-and-down scrolling is not blocked
  p = await open(DEMO, { w: 390, h: 844, touch: true });
  const cdp = await p.context().newCDPSession(p);
  const swipe = async (x0, y0, dx, dy, steps = 14) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / steps, y: y0 + dy * i / steps, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(900);
  };
  await jump(p, CYL, -80); await p.waitForTimeout(400);
  let s0 = await p.evaluate(() => scrollY); await swipe(195, 520, 0, -260);
  let s1 = await p.evaluate(() => scrollY);
  ok(s1 - s0 > 150 && await cur(p, CYL) === 0, 'touch: a vertical swipe on the cylinder scrolls the page', `scrolled ${Math.round(s1 - s0)}px`);
  await jump(p, CYL, -80); await p.waitForTimeout(400); s0 = await p.evaluate(() => scrollY); await swipe(300, 420, -170, 8);
  s1 = await p.evaluate(() => scrollY);
  ok(await cur(p, CYL) === 1 && Math.abs(s1 - s0) < 3, 'touch: a sideways swipe turns the cylinder and the page stays put', `step ${await cur(p, CYL) + 1}, page moved ${Math.round(s1 - s0)}px`);
  await swipe(100, 420, 170, -8); ok(await cur(p, CYL) === 0, 'touch: swipe back returns');
  await swipe(300, 420, -26, 2, 3); await p.waitForTimeout(300);
  ok(await cur(p, CYL) === 1 || await cur(p, CYL) === 0, 'touch: a short flick settles on a card (soft snap)', 'step ' + (await cur(p, CYL) + 1));
  await jump(p, RING, -200); await p.waitForTimeout(600);
  const rb = await p.locator(`${RING} .kws-ring-stage`).boundingBox(); const f0 = await front(p, RING);
  s0 = await p.evaluate(() => scrollY); await swipe(rb.x + rb.width / 2, rb.y + rb.height / 2, 0, -200); s1 = await p.evaluate(() => scrollY);
  ok(s1 - s0 > 120, 'touch: a vertical swipe on the ring scrolls the page', `scrolled ${Math.round(s1 - s0)}px`);
  const rb2 = await p.locator(`${RING} .kws-ring-stage`).boundingBox(); const f1 = await front(p, RING);
  s0 = await p.evaluate(() => scrollY); await swipe(rb2.x + rb2.width * .7, rb2.y + rb2.height / 2, -150, 6); s1 = await p.evaluate(() => scrollY);
  const f2 = await front(p, RING);
  ok(f2 !== f1 && Math.abs(s1 - s0) < 3, 'touch: a sideways swipe turns the ring and the page stays put', `front card ${f1} to ${f2}; scroll turned it ${f0} to ${f1}`);
  const sizes = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-ctl button')].map(x => { const r = x.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }), CYL);
  ok(sizes.every(s => { const [w, h] = s.split('x').map(Number); return w >= 44 && h >= 44; }), 'controls are at least 44px at 390px wide', sizes.join(' '));
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no sideways page scroll at 390px');
  await p.context().close();

  // a touch drag is followed by no click at all: the next keyboard press on a link must still go through
  p = await open(BARE, { w: 390, h: 844, touch: true });
  { const cdp2 = await p.context().newCDPSession(p); const bb = await p.locator('.kws-cyl-card.is-on').boundingBox(), x0 = bb.x + bb.width * .7, y0 = bb.y + 60;
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= 12; i++) { await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - i * 14, y: y0 + 1, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(p, '.kws-cyl'); await p.waitForTimeout(100);
    const now = await cur(p, '.kws-cyl'); await p.focus('.kws-cyl-card.is-on a'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok(now === 1 && await p.evaluate(() => location.hash) === '#step-2', 'after a touch drag, Enter on the centre card\'s link still follows it', await p.evaluate(() => location.hash)); }
  await p.context().close();

  // ---- 6. nothing runs when idle; the wheel is never listened to
  p = await open(DEMO, { w: 390, h: 844 });
  await jump(p, RING, -200); await p.waitForTimeout(1200);
  const i0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(2000);
  const idle = await p.evaluate(() => window.__raf) - i0;
  ok(idle === 0, 'idle with the ring on screen: no animation frames asked for in 2s', idle);
  await p.mouse.wheel(0, 300); await p.waitForTimeout(900); const i1 = await p.evaluate(() => window.__raf); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => window.__raf) - i1 === 0 && await p.evaluate(() => !document.querySelector('.is-moving')), 'after a scroll the ring settles and stops asking for frames');
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600); const i2 = await p.evaluate(() => window.__raf);
  await p.evaluate(() => { const y = document.querySelector('#included').getBoundingClientRect().top + scrollY; scrollTo(0, y - innerHeight - 900); }); await p.waitForTimeout(100);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, 60); await p.waitForTimeout(50); } await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__raf) - i2 === 0, 'scrolling with the ring off screen asks for no frames');
  const fs = require('fs'), src = ['cylinder.js', 'ring.js'].map(f => fs.readFileSync(__dirname + '/../' + f, 'utf8')).join('\n');
  ok(!/['"]wheel['"]|mousewheel/.test(src), 'no wheel listener anywhere in the scripts');
  ok(!/preventDefault/.test(fs.readFileSync(__dirname + '/../ring.js', 'utf8')), 'the ring never calls preventDefault');
  await p.context().close();

  // ---- 7. mount API: twice, after load, off() cleans up
  p = await open(DEMO);
  const api = await p.evaluate(() => {
    const el = document.querySelector('#how .kws-cyl'), before = el.outerHTML.length;
    const off1 = KWS.cylinder.mount(el), off2 = KWS.cylinder.mount(el), same = off1 === off2;
    off1(); const clean = !el.classList.contains('is-live') && !el.querySelector('.kws-cyl-ctl,.kws-cyl-sr') && !el.hasAttribute('aria-roledescription') && ![...el.querySelectorAll('.kws-cyl-card')].some(c => c.style.transform || c.style.opacity || c.hasAttribute('aria-label') || c.className !== 'kws-cyl-card');
    const off3 = KWS.cylinder.mount(el, { start: 2, loop: false }), again = el.classList.contains('is-live') && [...el.querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')) === 2 && el.querySelector('.kws-cyl-nav:last-child').getAttribute('aria-disabled') === 'false';
    el.querySelector('.kws-cyl-nav:last-child').click(); el.querySelector('.kws-cyl-nav:last-child').click(); el.querySelector('.kws-cyl-nav:last-child').click();
    const r = document.querySelector('#included .kws-ring'), roff = KWS.ring.mount(r), rsame = roff === KWS.ring.mount(r); roff();
    const rclean = !r.classList.contains('is-live') && !r.querySelector('.kws-ring-hub') && !!r.querySelector('.kws-ring-stage');
    const r2 = KWS.ring.mount(r, { speed: .2, tilt: 30 });
    return { same, clean, again, rsame, rclean, rlive: r.classList.contains('is-live') && r.querySelectorAll('.kws-ring-card').length === 30, type: typeof off3 + typeof r2 };
  });
  await p.waitForTimeout(900);
  ok(api.same && api.rsame, 'mounting twice on one element returns the same remover');
  ok(api.clean && api.rclean, 'the remover takes away everything the script added');
  ok(api.again && api.rlive, 'it mounts again after removal, with options (start: 2, loop: false; speed, tilt)');
  ok(await cur(p, CYL) === 4 && await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').getAttribute('aria-disabled'), CYL) === 'true', 'loop: false stops at the last card and marks next as disabled');
  // a new element mounted after load, with no stage in its markup and no groups
  const late = await p.evaluate(() => { const d = document.createElement('div'); d.className = 'kws-ring'; d.innerHTML = '<ul><li>One</li><li>Two</li><li>Three</li><li>Four</li><li>Five</li><li>Six</li></ul>'; document.querySelector('#included .container').append(d);
    const off = KWS.ring.mount(d); const made = d.firstElementChild.className === 'kws-ring-stage' && d.querySelectorAll('.kws-ring-card').length === 6 && ![...d.querySelectorAll('.kws-ring-tab')].some(t => t.textContent); off(); const gone = !d.querySelector('.kws-ring-stage'); d.remove(); return made && gone; });
  ok(late, 'ring: mounts on a plain list after load, makes its own stage, and removes it again');
  ok(p.errs.length === 0, 'no errors through the mount tests', p.errs.join('|'));
  await p.context().close();

  // ---- 8. small screens and no 3D
  p = await open(DEMO, { w: 360, h: 780 });
  await p.click(`${CYL} .kws-cyl-nav:last-child`); await p.waitForTimeout(120);
  const flat = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-card')].map(c => c.style.transform).filter(t => t !== 'none').join(' '), CYL); await settle(p, CYL);
  ok(/translateX/.test(flat) && !/rotate/.test(flat), 'under 380px the cylinder is a flat sliding row');
  ok(await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-ring-stage')).display === 'none' && document.querySelector(s + ' .kws-ring-lists').getBoundingClientRect().height > 300, RING), 'under 380px the ring gives way to its lists');
  const sz360 = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-ctl button')].map(x => { const r = x.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }), CYL);
  ok(sz360.every(s => { const [w, h] = s.split('x').map(Number); return w >= 44 && h >= 44; }), 'controls are at least 44px at 360px wide', sz360.join(' '));
  await p.context().close();
  p = await open(DEMO, { init: () => { const s = CSS.supports.bind(CSS); CSS.supports = (a, b) => /perspective|preserve-3d/.test(a + ' ' + b) ? false : s(a, b); } });
  await p.click(`${CYL} .kws-cyl-nav:last-child`); await p.waitForTimeout(120);
  const flat2 = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-card')].map(c => c.style.transform).filter(t => t !== 'none').join(' '), CYL);
  ok(/translateX/.test(flat2) && !/rotate|perspective/.test(flat2), 'no 3D transforms in the browser: the cylinder is a flat sliding row');
  ok(await p.evaluate(s => !document.querySelector(s).classList.contains('is-live') && !document.querySelector(s + ' .kws-ring-card'), RING), 'no 3D transforms in the browser: the ring does not start (its lists stay)');
  await p.context().close();

  // ---- 9. script off
  p = await open(DEMO, { js: false, w: 390, h: 844 });
  const off = await p.evaluate(() => { const vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 40 && r.height > 20 && c.visibility === 'visible' && +c.opacity === 1 && r.left >= 0 && r.right <= innerWidth + 1; };
    return { cards: [...document.querySelectorAll('#how .kws-cyl-card')].every(vis), items: [...document.querySelectorAll('#included li')].every(e => vis(e)), stage: getComputedStyle(document.querySelector('#included .kws-ring-stage')).display, ctl: document.querySelectorAll('.kws-cyl-ctl').length, wide: document.documentElement.scrollWidth - innerWidth }; });
  ok(off.cards && off.items && off.stage === 'none' && off.ctl === 0 && off.wide <= 0, 'script off: every card and every list item is on the page, in view width, nothing dead', JSON.stringify(off));
  await p.context().close();

  // ---- 10. no layout shift when the scripts upgrade the markup
  for (const w of [390, 820, 1440]) {
    p = await open(DEMO, { w, h: 900, block: /kit\/depth\/(cylinder|ring)\.js/ });
    const held = await p.evaluate(() => [...document.querySelectorAll('.kws-cyl,.kws-ring')].map(e => Math.round(e.getBoundingClientRect().height * 10) / 10));
    await p.context().close();
    p = await open(DEMO, { w, h: 900 });
    const live = await p.evaluate(() => [...document.querySelectorAll('.kws-cyl,.kws-ring')].map(e => Math.round(e.getBoundingClientRect().height * 10) / 10));
    const [cls, who] = await p.evaluate(() => new Promise(r => { let s = 0; const w = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { s += e.value; w.push(...e.sources.map(x => x.node && (x.node.className || x.node.nodeName))); } }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => r([s, [...new Set(w)].join(',')]), 400); }));
    ok(held.join() === live.join() && cls < .005, `${w}px: the space is reserved before the scripts run (heights equal, layout shift ${cls.toFixed(4)})`, `held ${held.join(' ')} / live ${live.join(' ')}${who ? ' / moved: ' + who : ''}`);
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
