// What a visitor gets if a kit script never arrives (blocked), or arrives after the four seconds are up.
//   node test/held.js [chromium|firefox|webkit]
const { engine, DEMO } = require('./lib');
(async () => {
  const name = process.argv[2] || 'chromium', b = await engine(name).launch(); let bad = 0;
  const m = p => p.evaluate(() => { const el = document.querySelector('#how .kws-cyl'), c = [...el.querySelectorAll('.kws-cyl-card')], st = document.querySelector('#included .kws-ring-stage'), ring = document.querySelector('#included .kws-ring');
    return { cyl: Math.round(el.getBoundingClientRect().height), shown: c.filter(x => getComputedStyle(x).visibility === 'visible').length, cols: new Set(c.map(x => Math.round(x.getBoundingClientRect().left))).size, stage: Math.round(st.getBoundingClientRect().height), lists: Math.round(ring.querySelector('.kws-ring-lists').getBoundingClientRect().width), hold: document.documentElement.classList.contains('kws-hold') }; });
  for (const rm of [false, true]) for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(DEMO, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700);
    const a = await m(p);
    if (!rm) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#how .kws-cyl').getBoundingClientRect().top + scrollY - 90); }); await p.screenshot({ path: `${__dirname}/../shots/held-${name}-${w}-1-before-script.png` }); }
    await p.waitForTimeout(4000);
    const z = await m(p);
    if (!rm) await p.screenshot({ path: `${__dirname}/../shots/held-${name}-${w}-2-script-never-came.png` });
    const fine = a.hold && a.shown === 1 && a.stage > 200 && !z.hold && z.shown === 5 && z.stage === 0 && z.cols === (w > 1100 ? 3 : 1) && z.lists > (w > 1100 ? 1100 : 300);
    if (!fine) bad++;
    console.log(`${fine ? 'PASS' : 'FAIL'}  ${name} ${w}px${rm ? ', reduced motion' : ''}: scripts blocked. Held: one card, drum ${a.cyl}px, stage ${a.stage}px. After four seconds: all ${z.shown} cards in ${z.cols} column${z.cols > 1 ? 's' : ''}, no stage (${z.stage}px), lists ${z.lists}px wide`);
    await ctx.close();
  }
  // a script that arrives after the hold has ended still upgrades the list (with one shift, which cannot be helped)
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await new Promise(d => setTimeout(d, 5200)); r.continue(); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); await p.goto(DEMO, { waitUntil: 'commit' }); await p.waitForTimeout(4350);
  const mid = await m(p); await p.waitForFunction(() => document.querySelectorAll('.is-live').length === 4, null, { timeout: 6000 }).catch(() => {});
  const end = await p.evaluate(() => document.querySelectorAll('.is-live').length);
  const fine = mid.shown === 5 && end === 4 && !errs.length; if (!fine) bad++;
  console.log(`${fine ? 'PASS' : 'FAIL'}  ${name} 390px: scripts 5.2s late. At 4.3s the plain lists are back (${mid.shown} cards); when the scripts land all ${end} components start${errs.length ? '; errors: ' + errs.join() : ''}`);
  await b.close(); process.exit(bad ? 1 : 0);
})();
