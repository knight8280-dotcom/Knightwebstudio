const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Accessibility.enable'); const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    console.log('toc/other link names:', JSON.stringify(nodes.filter(n => !n.ignored && n.role && n.role.value === 'link' && /packages|How you pay|Add-ons|Care plans|Consulting &/.test((n.name || {}).value || '')).map(n => n.name.value).slice(0, 8)));
    console.log('rowheaders:', JSON.stringify(nodes.filter(n => !n.ignored && n.role && n.role.value === 'rowheader').map(n => n.name.value)));
    const r = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => !h.closest('[hidden]')).map(h => h.tagName + ' ' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 50));
      const targets = [...document.querySelectorAll('main a, main button, main summary')].map(a => { const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { t: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), disp: cs.display, y: Math.round(r.top + scrollY) }; });
      // spacing between adjacent targets (vertical gap)
      return { hs, targets, h1: document.querySelectorAll('h1').length };
    });
    console.log('h1 count', r.h1); console.log(r.hs.join('\n'));
    console.log('TARGETS at 390 (w x h, display):'); for (const t of r.targets) console.log(`  ${String(t.w).padStart(3)}x${String(t.h).padStart(3)} ${t.disp.padEnd(12)} ${t.t}${t.h < 44 ? '   <-- under 44' : ''}`);
    // first screen: what is above the fold at 390x664 and 390x844 and 360x640
    for (const [w, h] of [[390, 664], [390, 844], [360, 640], [375, 667]]) { await p.setViewportSize({ width: w, height: h }); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(150);
      console.log(`first screen ${w}x${h}:`, JSON.stringify(await p.evaluate(() => { const q = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return Math.round(r.bottom); }; return { h1Bottom: q('h1'), ledeBottom: q('.lede'), btnBottom: q('.page-head .btn'), firstTocRowBottom: q('.toc li:first-child a'), firstPriceBottom: q('.toc li:first-child .toc-price'), vh: innerHeight }; }))); }
    // animations
    await p.setViewportSize({ width: 390, height: 844 });
    for (let y = 0; y < 11000; y += 600) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(80); }
    await p.waitForTimeout(1500);
    console.log('running animations after scroll-through:', JSON.stringify(await p.evaluate(() => document.getAnimations().map(a => ({ n: a.animationName || a.transitionProperty, it: a.effect && a.effect.getComputedTiming().iterations, st: a.playState, el: (a.effect.target.className || a.effect.target.tagName).toString().slice(0, 30) })).filter(a => a.st === 'running' || a.it === Infinity))));
    console.log('reveal blocks still hidden after scrolling through:', await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity !== '1').length), 'of', await p.evaluate(() => document.querySelectorAll('.reveal').length));
    await ctx.close(); }
  // reveals: scroll to each reveal quickly and see whether content is visible when reached (not faded)
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const first = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => e.getBoundingClientRect().top < innerHeight).map(e => (e.id || e.className).slice(0, 40)));
    console.log('reveal blocks in the first desktop screen (handbook: never):', JSON.stringify(first));
    const css = await p.evaluate(() => [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => r.type === CSSRule.KEYFRAMES_RULE).map(r => r.name));
    console.log('keyframes on page:', css.join(', '));
    await ctx.close(); }
  // reduced motion
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(300);
    console.log('reduced motion: hidden reveals', await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity !== '1' || getComputedStyle(e).transform !== 'none').length), 'btn transition:', await p.evaluate(() => getComputedStyle(document.querySelector('.btn')).transitionDuration), 'scroll-behavior:', await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior));
    await ctx.close(); }
  await b.close();
})();
