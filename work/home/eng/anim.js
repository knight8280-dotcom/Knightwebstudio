const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'domcontentloaded' });
    const snap = async (label) => { const a = await p.evaluate(() => document.getAnimations().map(a => { const t = a.effect.getComputedTiming(); const tg = a.effect.target; return { name: a.animationName || a.transitionProperty || 'anim', el: tg ? (tg.tagName.toLowerCase() + '.' + (tg.getAttribute('class') || '')).slice(0, 40) : '?', dur: t.duration, delay: t.delay, iter: t.iterations, end: t.endTime, state: a.playState, props: a.effect.getKeyframes().flatMap(k => Object.keys(k)).filter(k => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)).filter((v, i, a) => a.indexOf(v) === i).join(',') }; })); console.log(`--- ${w} ${label}: ${a.length} animations`); const uniq = {}; a.forEach(x => { const k = `${x.name} ${x.el} dur ${x.dur} delay ${x.delay} iter ${x.iter} end ${x.end} [${x.props}] ${x.state}`; uniq[k] = (uniq[k] || 0) + 1; }); Object.entries(uniq).forEach(([k, v]) => console.log('   ' + v + 'x ' + k)); return a; };
    await snap('at DOMContentLoaded'); await p.waitForTimeout(2500); await snap('2.5s'); await p.waitForTimeout(4000); const late = await snap('6.5s');
    // scroll through the whole page then check again for anything endless
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    const inf = new Set();
    for (let y = 0; y < H; y += h * 0.8) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(350); (await p.evaluate(() => document.getAnimations().map(a => { const t = a.effect.getComputedTiming(); return { n: a.animationName || a.transitionProperty, it: t.iterations, end: t.endTime, el: a.effect.target && a.effect.target.getAttribute('class') }; }))).forEach(x => { if (x.it === Infinity || x.end > 6000) inf.add(JSON.stringify(x)); }); }
    console.log('endless or >6s animations met while scrolling:', [...inf]);
    await p.waitForTimeout(5000); await snap('5s after reaching the bottom');
    await ctx.close();
  }
  await b.close();
})();
