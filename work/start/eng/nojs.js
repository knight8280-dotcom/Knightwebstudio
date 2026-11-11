const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
const probe = () => {
  const out = { invisible: [], dead: [] };
  for (const el of document.querySelectorAll('main *, header *, footer *, .topbar *')) {
    if (el.ownerSVGElement || el.closest('.sr-only')) continue; const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    let op = 1, e = el; while (e) { op *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; }
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && (op < .99 || cs.visibility === 'hidden')) out.invisible.push(el.tagName.toLowerCase() + '.' + el.className.toString().split(' ')[0] + ' op=' + op.toFixed(2) + ' "' + el.textContent.trim().slice(0, 24) + '"');
  }
  out.displayNone = [...document.querySelectorAll('body *')].filter(el => !el.ownerSVGElement && el.tagName !== 'SCRIPT' && getComputedStyle(el).display === 'none' && getComputedStyle(el.parentElement).display !== 'none').map(el => el.tagName.toLowerCase() + '#' + el.id + '.' + el.className.toString().split(' ').join('.'));
  out.buttons = [...document.querySelectorAll('button')].map(b => b.id + ':' + getComputedStyle(b).display);
  out.booking = [...document.querySelectorAll('[data-booking]')].map(a => a.getAttribute('href') + '|' + (a.offsetWidth ? 'visible' : 'hidden'));
  out.htmlClass = document.documentElement.className; out.theme = document.documentElement.getAttribute('data-theme'); out.bg = getComputedStyle(document.body).backgroundColor;
  out.h = document.documentElement.scrollHeight; out.over = document.documentElement.scrollWidth - innerWidth;
  out.headerPos = getComputedStyle(document.getElementById('site-header')).position;
  out.markAnim = getComputedStyle(document.querySelector('.mark'), '::after').animationName + ' ' + getComputedStyle(document.querySelector('.mark'), '::after').transform;
  out.anims = document.getAnimations().map(a => (a.animationName || a.transitionProperty || '?') + ' iter=' + (a.effect && a.effect.getComputedTiming().iterations) + ' state=' + a.playState);
  return out;
};
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: false, colorScheme: scheme });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    // evaluate needs JS in page? Playwright evaluate works with JS disabled via CDP isolated world
    let r; try { r = await p.evaluate(probe); } catch (e) { r = { err: e.message }; }
    console.log(`\n== NO JS ${w} ${scheme}`); console.log(JSON.stringify(r));
    await p.screenshot({ path: `work/start/eng/nojs-${w}-${scheme}.png`, fullPage: true });
    await ctx.close();
  }
  // main.js blocked (script fails to load): reveals must show after 4s
  for (const w of [390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route(/main\.js/, r => r.abort()); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
    const early = await p.evaluate(probe); await p.waitForTimeout(4200); const late = await p.evaluate(probe);
    console.log('\n== main.js BLOCKED 390: at 0.8s invisible:', JSON.stringify(early.invisible.slice(0, 6)), 'count', early.invisible.length, 'class', early.htmlClass);
    console.log('   at 5s invisible:', JSON.stringify(late.invisible), 'class', JSON.stringify(late.htmlClass), 'theme-toggle', late.buttons, 'booking', JSON.stringify(late.booking));
    await ctx.close();
  }
  // reduced motion
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(300);
    const r = await p.evaluate(probe); console.log(`\n== REDUCED MOTION ${w}: invisible`, JSON.stringify(r.invisible), 'mark', r.markAnim, 'anims', JSON.stringify(r.anims));
    await ctx.close();
  }
  // normal motion: animations list right after load and after scroll
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.route(/plausible|calendly/, r => r.abort());
    await ctx.addInitScript(() => { try { sessionStorage.removeItem('kws-crest'); } catch (e) {} });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(100);
    const a0 = await p.evaluate(() => document.getAnimations().map(a => (a.animationName || 'transition:' + a.transitionProperty) + ' iter=' + a.effect.getComputedTiming().iterations + ' dur=' + a.effect.getComputedTiming().duration + ' delay=' + a.effect.getComputedTiming().delay + ' fill=' + a.effect.getComputedTiming().fill));
    console.log('\n== animations at load (1440):', JSON.stringify([...new Set(a0)]));
    await p.waitForTimeout(3000); const a1 = await p.evaluate(() => document.getAnimations().map(a => (a.animationName || 'transition:' + a.transitionProperty) + ' ' + a.playState));
    console.log('   still running after 3s:', JSON.stringify(a1.filter(x => /running/.test(x))));
    const props = await p.evaluate(() => { const names = new Set(); for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.type === CSSRule.KEYFRAMES_RULE) names.add(r.name + ':' + [...r.cssRules].map(k => k.style.cssText).join('|')); } catch (e) {} } return [...names]; });
    console.log('   keyframes:', JSON.stringify(props));
    await ctx.close(); }
  await b.close();
})();
