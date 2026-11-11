// Motion settings are obeyed in the middle of a move, not only at its start; nothing runs off screen; nothing runs when idle.
const { chromium, say, done, open, on, bring, A, S } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [name, sel] of [['wheel', A], ['spotlight', S]]) {
    const { ctx, p } = await open(b); await bring(p, sel);
    await p.evaluate(() => { window.__n = 0; });
    // idle
    await p.waitForTimeout(1500); const idle = await p.evaluate(() => window.__n);
    say(`${name}: no animation frame is asked for while it is idle`, idle === 0, `${idle} in 1.5s`);
    // pause in mid-flight
    const r = await p.evaluate(async s => { const el = document.querySelector(s); el.querySelector('[aria-label^="Next"]').click(); await new Promise(r => setTimeout(r, 90));
      const mid = el.classList.contains('is-moving'); document.documentElement.dataset.motion = 'off'; const n0 = window.__n;
      for (let t = 0; t < 40 && el.classList.contains('is-moving'); t++) await new Promise(r => setTimeout(r, 25));   // one frame, however long this machine takes to draw it
      const out = { mid, movingAfter: el.classList.contains('is-moving'), frames: window.__n - n0, on: [...el.querySelectorAll(':scope > ul > li')].findIndex(li => li.classList.contains('is-on')) }; delete document.documentElement.dataset.motion; return out; }, sel);
    say(`${name}: pausing motion in the middle of a move ends it on the next frame, on the item it was heading for`, r.mid && !r.movingAfter && r.frames <= 1 && r.on === 1, JSON.stringify(r));
    // the same for the device setting
    await p.evaluate(s => document.querySelector(s + ' [aria-label^="Next"]').click(), sel); await p.waitForTimeout(90);
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForFunction(s => !document.querySelector(s).classList.contains('is-moving'), sel, { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(60);
    say(`${name}: so does the device's reduced-motion setting`, !(await p.evaluate(s => document.querySelector(s).classList.contains('is-moving'), sel)) && await on(p, sel) === 2, `item ${await on(p, sel) + 1}`);
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    // scrolled away in mid-flight
    await p.evaluate(s => document.querySelector(s + ' [aria-label^="Next"]').click(), sel); await p.waitForTimeout(90);
    await p.evaluate(s => scrollTo(0, s.includes('arc') ? document.body.scrollHeight : 0), sel); await p.waitForTimeout(150); const n1 = await p.evaluate(() => window.__n); await p.waitForTimeout(600); const n2 = await p.evaluate(() => window.__n);
    say(`${name}: scrolled off screen in mid-move, it stops asking for frames`, n2 - n1 === 0 && !(await p.evaluate(s => document.querySelector(s).classList.contains('is-moving'), sel)), `${n2 - n1} frames in the next 0.6s`);
    // a move made while off screen is applied at once
    const off = await p.evaluate(s => { const el = document.querySelector(s); const n0 = window.__n; el.querySelector('[aria-label^="Next"]').click(); return { frames: window.__n - n0, moving: el.classList.contains('is-moving') }; }, sel);
    say(`${name}: a move made while off screen is applied at once, with no frames`, off.frames === 0 && !off.moving, JSON.stringify(off));
    const wc = await p.evaluate(s => getComputedStyle(document.querySelector(s + ' li.is-on [class$="-tile"], ' + s + ' li.is-on [class$="-frame"]')).willChange, sel);
    say(`${name}: will-change is off when nothing is moving`, wc === 'auto', wc);
    await ctx.close();
  }
  await done(b);
})();
