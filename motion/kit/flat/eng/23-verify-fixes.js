// Verify the two proposed fixes WITHOUT touching the kit files: patched copies are served through request interception only.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const fs = require('fs'); const K = __dirname + '/../';
const patchJs = (src) => { let s = src; const a = "if (!g || e.pointerId !== g.id) return;\n\t\tlet dx"; if (!s.includes(a)) throw new Error('anchor not found'); s = s.replace(a, "if (!g || e.pointerId !== g.id) return;\n\t\tif (!e.buttons) return up(e);\n\t\tlet dx"); s = s.replace("x.getAttribute('style'), ", ''); return s; };
const patchCss = (src, k) => { let s = src; const n0 = s.length;
  s = s.replace(`.js .kws-${k}:not(.is-live){padding-bottom:3.75rem}`, `.kws-hold .kws-${k}:not(.is-live){padding-bottom:3.75rem}`);
  s = s.replace(`.js .kws-${k}:not(.is-live) li+li{overflow:hidden;animation:kws-${k}-hold 4s step-end}\n@keyframes kws-${k}-hold{0%{max-height:0}}`, `.kws-hold .kws-${k}:not(.is-live) li+li{display:none}`);
  s = s.split(':is(.js,.is-live)').join(':is(.kws-hold,.is-live)'); if (s.length === n0) throw new Error('css not patched'); return s; };
const arcJs = patchJs(fs.readFileSync(K + 'arc.js', 'utf8')), spotJs = patchJs(fs.readFileSync(K + 'spotlight.js', 'utf8')), arcCss = patchCss(fs.readFileSync(K + 'arc.css', 'utf8'), 'arc'), spotCss = patchCss(fs.readFileSync(K + 'spotlight.css', 'utf8'), 'spot');
console.log('patched sizes (bytes): arc.js', Buffer.byteLength(arcJs), 'spotlight.js', Buffer.byteLength(spotJs), 'arc.css', Buffer.byteLength(arcCss), 'spotlight.css', Buffer.byteLength(spotCss));
const wire = async (ctx, { delay = 0, never = false } = {}) => {
  await ctx.route('**/kit/flat/arc.js', async r => { if (never) return r.abort(); if (delay) await new Promise(x => setTimeout(x, delay)); r.fulfill({ contentType: 'text/javascript', body: arcJs }); });
  await ctx.route('**/kit/flat/spotlight.js', async r => { if (never) return r.abort(); if (delay) await new Promise(x => setTimeout(x, delay)); r.fulfill({ contentType: 'text/javascript', body: spotJs }); });
  await ctx.route('**/kit/flat/arc.css', r => r.fulfill({ contentType: 'text/css', body: arcCss })); await ctx.route('**/kit/flat/spotlight.css', r => r.fulfill({ contentType: 'text/css', body: spotCss }));
  await ctx.route('**/kit/flat/demo.html', async r => { const resp = await r.fetch(); let body = await resp.text(); const a = "var d = document.documentElement; d.classList.add('js');"; if (!body.includes(a)) throw new Error('head anchor'); body = body.replace(a, a + " d.classList.add('kws-hold'); setTimeout(function () { d.classList.remove('kws-hold'); }, 4000);"); r.fulfill({ response: resp, body }); }); };
(async () => {
  const b = await chromium.launch();
  // 1. hold fix: reduced motion and not, scripts +300ms, CLS and pre-upgrade height
  for (const rm of ['reduce', 'no-preference']) for (const [W, H, at] of [[390, 844, '#work'], [1440, 900, '#services'], [1440, 900, '#work']]) { const cls = [], preH = [];
    for (let i = 0; i < 5; i++) { const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: rm }); await wire(ctx, { delay: 300 });
      await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); window.__maxH = 0; const loop = () => { if (document.body && !document.querySelector('.is-live')) window.__maxH = Math.max(window.__maxH, document.documentElement.scrollHeight); if (performance.now() < 2000) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
      const p = await ctx.newPage(); await p.goto(URL + at, { waitUntil: 'load' }); await p.waitForTimeout(700); const r = await p.evaluate(() => [+window.__cls.toFixed(3), window.__maxH, document.documentElement.scrollHeight, document.querySelectorAll('.is-live').length]); cls.push(r[0]); preH.push(`${r[1]}->${r[2]}`); if (r[3] !== 4) console.log('  !! live count', r[3]); await ctx.close(); }
    console.log(`HOLD FIX ${rm.padEnd(13)} ${W} ${at.padEnd(9)} scripts +300ms: CLS [${cls.join(', ')}]  page height before->after upgrade [${[...new Set(preH)].join(' | ')}]`); }
  // 2. script never arrives: after 4s the list is the tidy script-off list (same height as with JS disabled)
  for (const W of [390, 1440]) { const ctx = await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'reduce' }); await wire(ctx, { never: true }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const h = () => p.evaluate(() => [...document.querySelectorAll('.kws-arc,.kws-spot')].slice(0, 2).map(e => [Math.round(e.getBoundingClientRect().height), [...e.querySelectorAll('li')].filter(li => li.getBoundingClientRect().height > 10).length])); const early = await h(); await p.waitForTimeout(4200); const late = await h();
    console.log(`HOLD FIX never-arrives ${W} (reduced motion): at 0.4s [height, items showing] ${JSON.stringify(early)}; at 4.6s ${JSON.stringify(late)}  (script-off list measured earlier: 390 -> 2058/1356, 1440 -> 758/463)`); await p.screenshot({ path: `fix-hold-fallback-${W}.png` }); await ctx.close(); }
  // 3. stale-drag fix + regression checks for mouse, pen, touch
  for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spot', '#work .kws-spot', '.kws-spot-frame']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await wire(ctx); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500); await scrollToSel(p, sel, 140); await p.waitForTimeout(200);
    const lb = await p.locator(`${sel} ul`).boundingBox(); const nb = await p.locator(`${sel} button[aria-label^="Next"]`).boundingBox(); const x = nb.x + nb.width / 2; const s0 = await state(p, sel);
    await p.mouse.move(x, lb.y + lb.height - 4); await p.mouse.down(); await p.mouse.move(x, lb.y + lb.height + 2, { steps: 2 }); await p.mouse.move(x, nb.y + 10, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(300);
    await p.mouse.move(x - 40, lb.y + lb.height - 20, { steps: 4 }); for (let i = 0; i < 25; i++) { await p.mouse.move(x - 40 - i * 12, lb.y + lb.height - 60 - i * 2); await p.waitForTimeout(16); } const s1 = await state(p, sel);
    await p.mouse.click(nb.x + nb.width / 2, nb.y + nb.height / 2); await settle(p, sel); const s2 = await state(p, sel);
    // regressions: mouse drag, pen drag
    const bx = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2; await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - i * 25, cy); await p.waitForTimeout(16); } const mid = await state(p, sel); await p.mouse.up(); await settle(p, sel); const s3 = await state(p, sel);
    console.log(`DRAG FIX ${name}: hover after sloppy click -> moving=${s1.moving} changed=${s1.tf.join() !== s0.tf.join()} (want false/false); Next then works: ${s0.on}->${s2.on}; mouse drag still works: mid-drag moving=${mid.moving}, ${s2.on}->${s3.on}; errors ${errs.length}`); await ctx.close();
    const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); await wire(c2); const q = await c2.newPage(); await q.goto(URL, { waitUntil: 'load' }); await q.waitForTimeout(500); await scrollToSel(q, sel, 180); await q.waitForTimeout(250); const cdp = await c2.newCDPSession(q);
    const tb = await q.locator(`${sel} li.is-on ${part}`).boundingBox(); const tx = tb.x + tb.width / 2, ty = tb.y + 30; const t0 = await state(q, sel);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tx, y: ty, id: 1 }] }); let follow = false; for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tx - i * 14, y: ty, id: 1 }] }); await q.waitForTimeout(16); if ((await state(q, sel)).tf.join() !== t0.tf.join()) follow = true; } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await settle(q, sel); const t1 = await state(q, sel);
    const y0 = await q.evaluate(() => scrollY); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tx, y: ty, id: 2 }] }); for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tx, y: ty - i * 20, id: 2 }] }); await q.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await q.waitForTimeout(500);
    console.log(`DRAG FIX ${name} touch: the sign follows the finger=${follow}, item ${t0.on}->${t1.on}; vertical swipe still scrolls ${(await q.evaluate(() => scrollY)) - y0}px`); await c2.close();
  }
  await b.close();
})();
