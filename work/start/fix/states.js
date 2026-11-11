// Hit areas of the two inline way-forward links, focus rings, hover, and enlarged text.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  // 1. hit areas at 390 and 360: probe points above and below the link text
  for (const w of [360, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(500);
    for (const sel of ['.board-foot p a', '.write a']) {
      const r = await p.evaluate(s => {
        const a = document.querySelector(s); a.scrollIntoView({ block: 'center' }); const rc = a.getBoundingClientRect(); const cx = rc.left + rc.width / 2;
        let top = rc.top, bot = rc.bottom;
        while (top > 0 && document.elementFromPoint(cx, top - 1) === a) top--;
        while (bot < innerHeight && document.elementFromPoint(cx, bot + 1) === a) bot++;
        const others = [...document.querySelectorAll('a, button')].filter(o => o !== a).map(o => o.getBoundingClientRect()).filter(o => o.width && !(o.right < rc.left || o.left > rc.right || o.bottom < top || o.top > bot)).length;
        return { text: a.textContent, box: Math.round(rc.width) + 'x' + Math.round(rc.height), hit: Math.round(bot - top), lines: a.getClientRects().length, overlapsOtherTargets: others };
      }, sel);
      console.log(w, sel, JSON.stringify(r));
    }
    await ctx.close();
  }
  // 2. focus rings and hover, desktop + phone
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(500);
    for (const [name, sel] of [['pricinglink', '.board-foot p a'], ['write', '.write a'], ['tier', '.tier'], ['strip', '.price-strip'], ['print', '.print']]) {
      await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(700);
      await p.focus(sel); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(150);
      const box = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, r.left - 60), y: Math.max(0, r.top - 50), width: Math.min(innerWidth - Math.max(0, r.left - 60), r.width + 120), height: Math.min(r.height + 100, 500) }; }, sel);
      await p.screenshot({ path: `${__dirname}/focus-${name}.png`, clip: box });
      await p.evaluate(() => document.activeElement.blur()); await p.hover(sel); await p.waitForTimeout(350);
      await p.screenshot({ path: `${__dirname}/hover-${name}.png`, clip: box });
      await p.mouse.move(5, 5);
    }
    await ctx.close();
  }
  // 3. text enlarged to 130%: does anything overflow its box in the head?
  for (const w of [360, 390, 820, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.addStyleTag({ content: 'html{font-size:130%}' }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const out = []; for (const li of document.querySelectorAll('.points li')) { const sp = li.querySelector('span'); const a = sp.getBoundingClientRect(), c = li.getBoundingClientRect(); if (sp.scrollWidth > sp.clientWidth + 1 || a.right > c.right + 1) out.push('fact overflows by ' + Math.round(a.right - c.right)); } const sh = document.querySelector('.page-head-aside').getBoundingClientRect(); return { factsOverflow: out, shop: Math.round(sh.width), pageOverflow: document.documentElement.scrollWidth - innerWidth, h1Lines: Math.round(document.querySelector('h1').getBoundingClientRect().height / parseFloat(getComputedStyle(document.querySelector('h1')).lineHeight)) }; });
    console.log('130% text', w, JSON.stringify(r));
    if (w === 390) await p.screenshot({ path: `${__dirname}/text130-390.png`, fullPage: false });
    await ctx.close();
  }
  await b.close();
})();
