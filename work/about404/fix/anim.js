// Frames of the arrival motion on /about/ (1440 and 390), and the state with reduced motion.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, clip] of [[1440, 900, { x: 60, y: 130, width: 1340, height: 520 }], [390, 844, { x: 0, y: 108, width: 390, height: 736 }]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/about/', { waitUntil: 'commit' });
    for (const t of [120, 330, 560, 800, 1300]) { await p.waitForTimeout(t - (p._last || 0)); p._last = t; await p.screenshot({ path: `/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/work/about404/fix/anim/anim-${w}-${t}.png`, clip }); }
    const end = await p.evaluate(() => { const c = document.querySelector('.bizcard'), cs = getComputedStyle(c); const m = getComputedStyle(document.querySelector('.mark'), '::after'); return { cardOpacity: cs.opacity, cardTransform: cs.transform, rotate: cs.rotate, markTransform: m.transform, anims: document.getAnimations().filter(a => a.playState !== 'finished').length }; });
    console.log(w, 'end state', JSON.stringify(end));
    await ctx.close();
  }
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'commit' }); await p.waitForTimeout(150);
  console.log('reduced motion at 150ms', JSON.stringify(await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.bizcard')); return { op: cs.opacity, tr: cs.transform, an: cs.animationName, mark: getComputedStyle(document.querySelector('.mark'), '::after').transform }; })));
  await b.close();
})();
