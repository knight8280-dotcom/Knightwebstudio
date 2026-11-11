// Retakes the screenshots in ../shots.   node test/shots.js   (Chromium: all of them)
//                                         node test/shots.js webkit    node test/shots.js firefox   (a few each; one engine a run)
const { engine, DEMO, BARE, CYL, RING, open, jump, settle, finger, line } = require('./lib');
const S = __dirname + '/../shots/';
const clipOf = async (p, sel, pad = 16) => p.evaluate(([s, pad]) => { const r = document.querySelector(s).getBoundingClientRect(); const y = Math.max(0, r.top - pad); return { x: 0, y, width: innerWidth, height: Math.max(40, Math.min(innerHeight, r.bottom + pad) - y) }; }, [sel, pad]);
const other = process.argv[2];
(async () => {
  if (other) { // other engines
    const e = await engine(other).launch();
    for (const w of [1280, 390]) { const q = await open(e, DEMO, { w, h: w < 700 ? 664 : 900, noMobile: true });
      await jump(q, CYL, w < 700 ? -64 : -160); await q.waitForTimeout(600); await q.click(CYL + ' .kws-cyl-nav:last-child'); await q.waitForTimeout(1500); await q.screenshot({ path: `${S}${other}-${w}-cylinder.png` });
      await jump(q, RING, w < 700 ? -70 : -120); await q.waitForTimeout(3500); await q.screenshot({ path: `${S}${other}-${w}-ring.png` }); await q.ctx.close(); }
    await e.close(); return console.log(other, 'shots written to', S);
  }
  const b = await engine('chromium').launch();
  for (const dark of [false, true]) for (const w of [1440, 390]) {
    const t = dark ? 'dark' : 'light', phone = w < 700, p = await open(b, DEMO, { w, h: phone ? 664 : 900, touch: phone, dark });
    // ---- the drum
    await jump(p, CYL, phone ? -64 : -200); await p.waitForTimeout(500);
    await p.screenshot({ path: `${S}cylinder-${w}-${t}-1-at-rest.png` });
    const bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(), cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
    if (phone) { const cdp = p.cdp = await p.ctx.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx + 60, y: cy, id: 1 }] }); for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 60 - i * 22, y: cy + 1, id: 1 }] }); await p.waitForTimeout(16); }
      await p.screenshot({ path: `${S}cylinder-${w}-${t}-2-mid-drag.png` }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(cx - i * 30, cy); await p.waitForTimeout(16); } await p.screenshot({ path: `${S}cylinder-${w}-${t}-2-mid-drag.png` }); await p.mouse.up(); }
    await p.waitForTimeout(90); await p.screenshot({ path: `${S}cylinder-${w}-${t}-3-released-90ms.png` }); await settle(p); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}cylinder-${w}-${t}-4-settled-on-2.png` });
    for (const i of [2, 3, 4]) { await p.evaluate(([s, i]) => document.querySelectorAll(s + ' .kws-cyl-dot')[i].click(), [CYL, i]); await settle(p); await p.waitForTimeout(350); await p.screenshot({ path: `${S}cylinder-${w}-${t}-5-step-${i + 1}.png`, clip: await clipOf(p, CYL) }); }
    if (!phone && !dark) { // controls: hover, focus, pressed
      await p.hover(CYL + ' .kws-cyl-dot[aria-current]'); await p.waitForTimeout(150); const kc = await clipOf(p, CYL + ' .kws-cyl-ctl', 10); kc.x = 500; kc.width = 440;
      await p.screenshot({ path: `${S}controls-1-pointer-on-the-current-dot.png`, clip: kc });
      await p.hover(CYL + ' .kws-cyl-dot:not([aria-current])'); await p.waitForTimeout(150); await p.screenshot({ path: `${S}controls-2-pointer-on-another-dot.png`, clip: kc });
      await p.hover(CYL + ' .kws-cyl-nav'); await p.waitForTimeout(150); await p.screenshot({ path: `${S}controls-3-pointer-on-previous-and-next-dimmed-at-the-end.png`, clip: kc });
      await p.mouse.move(5, 5); await p.focus(CYL + ' .kws-cyl-nav'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(150); await p.screenshot({ path: `${S}controls-4-keyboard-focus-on-a-dot.png`, clip: kc });
    }
    // ---- the ring
    await jump(p, RING, phone ? -70 : -150); await p.waitForTimeout(2200);
    await p.screenshot({ path: `${S}ring-${w}-${t}-1-at-rest.png` });
    for (let i = 1; i <= 3; i++) { await p.evaluate(() => scrollBy(0, 22)); await p.waitForTimeout(45); }
    await p.screenshot({ path: `${S}ring-${w}-${t}-2-turning-with-the-page.png` });
    await p.waitForTimeout(110); await p.screenshot({ path: `${S}ring-${w}-${t}-3-hand-over-110ms-later.png` });
    await p.waitForTimeout(2200); await p.screenshot({ path: `${S}ring-${w}-${t}-4-settled.png` });
    const sb = await p.locator(RING + ' .kws-ring-stage').boundingBox(), x = Math.max(200, Math.min(w - 60, sb.x + sb.width * .6)), y = sb.y + sb.height * .8;
    if (phone) await finger(p, line(x + 60, y, x - 60, y + 3, 6)); else { await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(x - i * 14, y); await p.waitForTimeout(16); } }
    await p.screenshot({ path: `${S}ring-${w}-${t}-5-${phone ? 'just-after-a-swipe' : 'mid-drag'}.png` }); if (!phone) await p.mouse.up();
    await p.waitForTimeout(3000); await p.screenshot({ path: `${S}ring-${w}-${t}-6-settled-after-drag.png` });
    // ---- the client palette
    if (!dark) { await jump(p, '#client .kws-cyl', phone ? -64 : -200); await p.waitForTimeout(600); await p.screenshot({ path: `${S}client-palette-${w}-cylinder.png` });
      await jump(p, '#client .kws-ring', phone ? -70 : -120); await p.waitForTimeout(2200); await p.screenshot({ path: `${S}client-palette-${w}-ring.png` }); }
    await p.ctx.close();
  }
  // other widths
  for (const [w, h] of [[360, 760], [820, 1180], [1000, 760], [1920, 1080]]) {
    const p = await open(b, DEMO, { w, h, touch: w < 900 });
    await jump(p, CYL, w < 700 ? -64 : -160); await p.waitForTimeout(500); await p.screenshot({ path: `${S}width-${w}-cylinder${w < 380 ? '-flat-row' : ''}.png` });
    await jump(p, RING, w < 700 ? -70 : -120); await p.waitForTimeout(2200); await p.screenshot({ path: `${S}width-${w}-ring${w < 380 ? '-gives-way-to-lists' : ''}.png` });
    await p.ctx.close();
  }
  // script off, reduced motion, a long story, the bare page
  for (const w of [1440, 390]) { const p = await open(b, DEMO, { w, h: 900, js: false });
    await jump(p, CYL, -120); await p.screenshot({ path: `${S}script-off-${w}-cylinder.png`, fullPage: false }); await jump(p, RING, -120); await p.screenshot({ path: `${S}script-off-${w}-ring.png` }); await p.ctx.close(); }
  let p = await open(b, DEMO, { w: 390, h: 664, touch: true, rm: true }); await jump(p, CYL, -64); await p.evaluate(s => { const n = document.querySelector(s + ' .kws-cyl-nav:last-child'); n.click(); n.click(); }, CYL); await p.waitForTimeout(200);
  await p.screenshot({ path: `${S}reduced-motion-390-cylinder-after-two-nexts.png` }); await jump(p, RING, -70); await p.waitForTimeout(400); await p.screenshot({ path: `${S}reduced-motion-390-ring-still.png` }); await p.ctx.close();
  p = await open(b, DEMO, { w: 390, h: 664, touch: true }); await p.evaluate(sel => { const el = document.querySelector(sel); KWS.cylinder.mount(el)(); const tr = el.querySelector('.kws-cyl-track'); tr.append(tr.children[0].cloneNode(true), tr.children[1].cloneNode(true)); KWS.cylinder.mount(el); }, CYL);
  await jump(p, CYL, -64); await p.waitForTimeout(400); await p.screenshot({ path: `${S}seven-cards-390-dots-wrap-to-a-second-row.png` }); await p.ctx.close();
  for (const w of [1280, 390]) { p = await open(b, BARE, { w, h: 900, touch: w < 700 }); await p.waitForTimeout(600); await p.screenshot({ path: `${S}bare-page-${w}-cylinder.png` }); await jump(p, '.kws-ring', -90); await p.waitForTimeout(2200); await p.screenshot({ path: `${S}bare-page-${w}-ring.png` }); await p.ctx.close(); }
  await b.close();
  console.log('shots written to', S);
})();
