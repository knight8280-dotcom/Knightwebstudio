// Tests a candidate SHARED header fix by injecting it at run time (nothing in the repository is changed).
const { chromium } = require('playwright');
const FIX = `@media (min-width: 1100px) { .header-cta { white-space: nowrap; } .nav-links a { padding-inline: var(--s-2); } .nav-links a::after { inset-inline: var(--s-2); } }`;
(async () => {
  const b = await chromium.launch();
  for (const path of ['/', '/pricing/']) for (const fix of [false, true]) {
    const bad = [];
    for (let w = 1100; w <= 1400; w += 10) {
      const ctx = await b.newContext({ viewport: { width: w, height: 800 } }); const p = await ctx.newPage();
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      await p.goto('http://localhost:8720' + path); if (fix) await p.addStyleTag({ content: FIX });
      await p.evaluate(() => { document.fonts.ready; scrollTo(0, 400); }); await p.waitForTimeout(450);
      const r = await p.evaluate(() => { const c = document.querySelector('.header-cta').getBoundingClientRect(), i = document.querySelector('.header-inner').getBoundingClientRect(); const t = document.querySelector('.header-tel').getBoundingClientRect(); const n = document.querySelector('.nav-links').getBoundingClientRect();
        return { h: Math.round(c.height), over: Math.round(c.right - i.right), telGap: t.width ? Math.round(t.left - n.right) : null }; });
      if (r.h > 44 || r.over > 0) bad.push(w + ':' + r.h + (r.over > 0 ? '+' + r.over : ''));
      if (fix && (w === 1100 || w === 1280)) console.log('   ', path, w, JSON.stringify(r));
      await ctx.close();
    }
    console.log(path, fix ? 'WITH the candidate fix' : 'as it is', bad.length ? 'button wraps or sticks out at: ' + bad.join(' ') : 'button on one line 1100-1400');
  }
  await b.close();
})();
