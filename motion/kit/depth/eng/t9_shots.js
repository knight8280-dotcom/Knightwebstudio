const { chromium, DEMO, log, open, jump } = require('./lib');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const [w, h, dpr, dark, touch] of [[390, 844, 3, false, true], [390, 844, 2, true, true], [1440, 900, 1, false, false], [820, 1100, 2, false, true]]) {
    const p = await open(b, DEMO, { w, h, dpr, dark, touch });
    await jump(p, '#included .kws-ring-stage', w < 980 ? -90 : -120); await p.waitForTimeout(900);
    const sb = await p.locator('#included .kws-ring-stage').boundingBox();
    await p.screenshot({ path: `shots/ring-${w}-dpr${dpr}-${dark ? 'night' : 'day'}.png`, clip: { x: Math.max(0, sb.x - 8), y: Math.max(0, sb.y - 8), width: Math.min(w, sb.width + 16), height: sb.height + 16 } });
    // is anything of the front card cut by the stage's clip?
    const cut = await p.evaluate(() => { const st = document.querySelector('#included .kws-ring-stage'), s = st.getBoundingClientRect(), f = st.querySelector('.is-front').getBoundingClientRect(); const all = [...st.querySelectorAll('.kws-ring-card:not(.is-back)')].map(c => c.getBoundingClientRect()); return { stage: [Math.round(s.width), Math.round(s.height)], front: { top: Math.round(f.top - s.top), bottom: Math.round(s.bottom - f.bottom), left: Math.round(f.left - s.left), right: Math.round(s.right - f.right), w: Math.round(f.width), h: Math.round(f.height) }, cardsCutBySides: all.filter(r => r.left < s.left - 1 || r.right > s.right + 1).length, cardsCutTopBottom: all.filter(r => r.top < s.top - 1 || r.bottom > s.bottom + 1).length, facing: all.length }; });
    log(`${w}px dpr ${dpr}: ${JSON.stringify(cut)}`);
    await p.ctx.close();
  }
  // a failed ring.js on a page that has html.js: what is left after 5s, at 1440
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.route(/kit\/depth\/ring\.js/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(DEMO, { waitUntil: 'load' }); await p.waitForTimeout(5200);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#included .kws-ring'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 120); }); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const st = document.querySelector('#included .kws-ring-stage'), l = document.querySelector('#included .kws-ring-lists'); return { js: document.documentElement.classList.contains('js'), stage: getComputedStyle(st).display + ' ' + Math.round(st.getBoundingClientRect().width) + 'x' + Math.round(st.getBoundingClientRect().height), children: st.children.length, lists: Math.round(l.getBoundingClientRect().width) }; });
  log('ring.js blocked, html.js present, after 5.2s at 1440: ' + JSON.stringify(r));
  await p.screenshot({ path: 'shots/ring-script-failed-1440.png' });
  await ctx.close(); await b.close();
})();
