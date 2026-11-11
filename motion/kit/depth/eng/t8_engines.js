// The two main defects in Firefox, and whether WebKit can be launched here at all.
const { firefox, webkit, DEMO, log, ok, jump, settle } = require('./lib');
const CYL = '#how .kws-cyl';
(async () => {
  for (const [name, type] of [['firefox', firefox], ['webkit', webkit]]) {
    let b; try { b = await type.launch(); } catch (e) { log(`SKIP  ${name}: cannot launch here (${String(e.message).split('\n')[0].slice(0, 120)})`); continue; }
    log(`${name} ${b.version()}`);
    // A. stuck drum
    let ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); let p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(DEMO, { waitUntil: 'load' }); await p.waitForTimeout(600); await jump(p, CYL); await p.waitForTimeout(300);
    const box = await p.locator(CYL + ' .kws-cyl-track').boundingBox();
    await p.click(CYL + ' .kws-cyl-nav:last-child'); await p.waitForTimeout(120); await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(2500);
    const s = await p.evaluate(s => { const el = document.querySelector(s), on = el.querySelector('.is-on'); return { moving: el.classList.contains('is-moving'), t: on.style.transform, op: on.style.opacity }; }, CYL);
    ok(!s.moving && s.t === 'none', `${name}: Next, then a click on the drum 120ms later: the turn finishes`, JSON.stringify(s));
    // keys, drag basic sanity
    await p.click(CYL + ' .kws-cyl-nav:last-child'); await settle(p, CYL); await p.focus(CYL + ' .kws-cyl-dot'); await p.keyboard.press('ArrowRight'); await settle(p, CYL);
    const on = await p.evaluate(s => [...document.querySelector(s).querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), CYL);
    log(`   ${name}: after Next + ArrowRight the drum is on step ${on + 1}; errors: ${errs.join('|') || 'none'}`);
    await ctx.close();
    // B. held state under reduced motion
    ctx = await b.newContext({ viewport: { width: 390, height: 3000 }, reducedMotion: 'reduce' }); let release; const gate = new Promise(r => release = r);
    await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await gate; r.continue(); });
    p = await ctx.newPage(); p.goto(DEMO, { waitUntil: 'commit' }).catch(() => {}); await p.waitForTimeout(1200);
    const held = await p.evaluate(() => Math.round(document.querySelector('.kws-cyl').getBoundingClientRect().height)); release(); await p.waitForTimeout(1500);
    const live = await p.evaluate(() => Math.round(document.querySelector('.kws-cyl').getBoundingClientRect().height));
    ok(held === live, `${name}: reduced motion, before the script: the drum's space is held`, `${held}px before, ${live}px after`);
    await ctx.close(); await b.close();
  }
})();
