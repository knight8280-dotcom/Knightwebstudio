const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const [w, pct] of [[390, 125], [390, 150], [1280, 125], [1280, 150], [1440, 200]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: `html{font-size:${pct}% !important}` }); await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).slice(0, 3).join('.'); return s; };
      // outermost elements in main wider than the viewport's content, deepest first offenders
      const offenders = []; for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (!r.width || el.closest('.sr-only, thead')) continue; if (r.right > innerWidth + 1) { const par = el.parentElement.getBoundingClientRect(); if (par.right <= innerWidth + 1 || r.right > par.right + 1) offenders.push(`${name(el)} right=${Math.round(r.right)} w=${Math.round(r.width)} (parent ${name(el.parentElement)} right=${Math.round(par.right)})`); } }
      return { over: document.documentElement.scrollWidth - innerWidth, offenders: offenders.slice(0, 14) }; });
    console.log(`\n== ${w}px text ${pct}%: overflowX ${r.over}`); r.offenders.forEach(x => console.log('  ' + x));
    await ctx.close();
  }
  await b.close();
})();
