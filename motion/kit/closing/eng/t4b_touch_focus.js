// Touch scroll with raw touch events over each kit part (page must scroll; nothing may cancel). Pen too. Focus rings on the bare page, Chromium + Firefox.
const { launch, open, firefox } = require('./common');
(async () => {
  const b = await launch();
  for (const kind of ['touch', 'pen']) {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    await p.waitForTimeout(1200);
    const s = await p.context().newCDPSession(p);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.__cancelled = 0; for (const t of ['touchstart', 'touchmove', 'pointerdown', 'pointermove', 'wheel']) addEventListener(t, e => { if (e.defaultPrevented) window.__cancelled++; }, { passive: true }); });
    for (const sel of ['.kws-close-title', '.kws-appt dl', '.kws-appt-btn', '.kws-close-btn', '.kws-close-tel a', '.kws-foot-tel', '.kws-foot-two a', '.kws-foot-bye', '.kws-skyline']) {
      await p.evaluate(sel => { const e = document.querySelector(sel); const q = e.getBoundingClientRect(); scrollTo(0, Math.min(q.top + scrollY - 420, document.documentElement.scrollHeight - innerHeight - 300)); }, sel);
      await p.waitForTimeout(200);
      const pos = await p.evaluate(sel => { const q = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(q.left + Math.min(q.width / 2, 80)), y: Math.round(Math.min(q.top + q.height / 2, 800)), sy: scrollY, href: location.href }; }, sel);
      if (kind === 'touch') {
        await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pos.x, y: pos.y }] });
        for (let i = 1; i <= 12; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pos.x + (i % 2), y: pos.y - i * 15 }] }); await p.waitForTimeout(16); }
        await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        // a pen drag on a touch screen pans like a finger in Chrome when pointerType is pen
        await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pos.x, y: pos.y, button: 'left', clickCount: 1, pointerType: 'pen' });
        for (let i = 1; i <= 12; i++) { await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pos.x, y: pos.y - i * 15, button: 'left', buttons: 1, pointerType: 'pen' }); await p.waitForTimeout(16); }
        await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pos.x, y: pos.y - 180, button: 'left', clickCount: 1, pointerType: 'pen' });
      }
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({ sy: scrollY, sx: scrollX, href: location.href, cancelled: window.__cancelled, sel: String(getSelection()).length }));
      console.log(`${kind} drag 180px up starting on ${sel}: page moved ${r.sy - pos.sy}px, scrollX ${r.sx}, navigated: ${r.href !== pos.href}, events cancelled: ${r.cancelled}, text selected: ${r.sel} chars`);
      if (r.href !== pos.href) { await p.goBack(); }
    }
    await p.context().close();
  }
  // Focus rings where the page gives none (client site): the browser default on the block, the card and the footer
  for (const [name, br] of [['chromium', b], ['firefox', await firefox.launch({ executablePath: '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/.browsers-flat/firefox-1543/firefox/firefox' }).catch(e => (console.log(String(e).slice(0,200)), null))]]) {
    if (!br) { console.log(name, 'could not launch'); continue; }
    const c = await br.newContext({ viewport: { width: 390, height: 844 } });
    const p = await c.newPage(); await p.goto('http://localhost:8730/kit/closing/portable.html'); await p.waitForTimeout(600);
    let i = 0;
    for (const sel of ['.kws-close--strip .kws-close-btn--main', '.kws-close--strip .kws-close-btn:not(.kws-close-btn--main)', '.kws-close--strip .kws-close-tel a', '.kws-appt-btn', '.kws-foot-tel', '.kws-foot-go']) {
      await p.evaluate(sel => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); }, sel);
      await p.keyboard.press('Tab'); // make the modality keyboard
      await p.evaluate(sel => document.querySelector(sel).focus({ focusVisible: true }), sel);
      await p.waitForTimeout(150);
      const st = await p.evaluate(sel => { const e = document.querySelector(sel), cs = getComputedStyle(e); return cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' matches:focus-visible=' + e.matches(':focus-visible'); }, sel);
      const q = await p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.max(0, r.left - 16), y: Math.max(0, r.top - 16), width: Math.min(390, r.width + 32), height: r.height + 32 }; }, sel);
      await p.screenshot({ path: `ring-${name}-${i++}.png`, clip: q });
      console.log(`${name} default focus ring on ${sel}: ${st}`);
    }
    await c.close(); if (br !== b) await br.close();
  }
  await b.close();
})();
