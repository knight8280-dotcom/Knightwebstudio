const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: rm });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(300);
    const first = await p.evaluate(() => ({ revealTotal: document.querySelectorAll('.reveal').length, visibleAtLoad: document.querySelectorAll('.reveal.visible').length, firstScreenReveal: [...document.querySelectorAll('.reveal')].filter(e => e.getBoundingClientRect().top < innerHeight).map(e => e.className) }));
    const r = await p.evaluate(() => {
      const out = { infinite: [], anims: new Set(), transitions: new Set(), nonTO: [] };
      for (const el of document.querySelectorAll('*')) { for (const pseudo of [null, '::before', '::after']) { const cs = getComputedStyle(el, pseudo); if (cs.animationName && cs.animationName !== 'none') { const key = `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')}${pseudo || ''} anim=${cs.animationName} dur=${cs.animationDuration} iter=${cs.animationIterationCount} delay=${cs.animationDelay}`; out.anims.add(key); if (/infinite/.test(cs.animationIterationCount)) out.infinite.push(key); }
        if (!pseudo && el.closest('main') && cs.transitionDuration && cs.transitionDuration.split(',').some(d => parseFloat(d) > 0)) { const props = cs.transitionProperty; out.transitions.add(`${props} | ${cs.transitionDuration} | delay ${cs.transitionDelay}`); if (!/^(transform|opacity|visibility|rotate|translate|scale|all|none|,|\s)+$/.test(props)) out.nonTO.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}: ${props} ${cs.transitionDuration}`); } } }
      return { infinite: out.infinite, anims: [...out.anims], transitions: [...out.transitions], nonTO: [...new Set(out.nonTO)].slice(0, 20) }; });
    console.log(`\n== prefers-reduced-motion: ${rm}`); console.log(JSON.stringify(first)); console.log(JSON.stringify(r, null, 1));
    // scroll to the sheet; do bars end at full size? and how long before last reveal is visible
    if (rm === 'no-preference') {
      await p.evaluate(() => document.querySelector('.sheet').scrollIntoView({ block: 'center', behavior: 'instant' }));
      for (const t of [50, 300, 600, 900, 1300]) { await p.waitForTimeout(t === 50 ? 50 : 300); console.log(' t~' + t, JSON.stringify(await p.evaluate(() => ({ vis: document.querySelector('.sheet').classList.contains('visible'), op: getComputedStyle(document.querySelector('.sheet')).opacity, bars: [...document.querySelectorAll('.ledger-bar span')].map(s => Math.round(s.getBoundingClientRect().width)) })))); }
      // jump straight to the bottom third: are late blocks visible quickly?
      await p.evaluate(() => document.querySelector('#bundle').scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(700);
      console.log(' bundle after 700ms', await p.evaluate(() => ({ op: getComputedStyle(document.querySelector('#bundle')).opacity, tr: getComputedStyle(document.querySelector('#bundle')).transform, rot: getComputedStyle(document.querySelector('#bundle .receipt')).rotate })));
      // typing dots / seq: any animation running after 5s?
      await p.waitForTimeout(4000); console.log(' running animations after 5s:', await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || a.transitionProperty) + ' on ' + (a.effect.target.className || a.effect.target.tagName))));
    }
    await ctx.close();
  }
  await b.close();
})();
