// node measure.js URL [width] [height] : prints section heights
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2], w = +(process.argv[3] || 390), h = +(process.argv[4] || 844);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = [];
    const add = (el, name) => { const rc = el.getBoundingClientRect(); out.push(`${name.padEnd(46)} top ${Math.round(rc.top + scrollY)}  h ${Math.round(rc.height)}`); };
    document.querySelectorAll('.topbar, .site-header, main > *, .site-footer').forEach(el => add(el, (el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').slice(0, 3).join('.') + (el.id ? '#' + el.id : ''))));
    document.querySelectorAll('[data-m]').forEach(el => add(el, '  [' + el.dataset.m + ']'));
    out.push('TOTAL ' + document.documentElement.scrollHeight + '  overflow-x ' + (document.documentElement.scrollWidth - innerWidth));
    return out;
  });
  console.log(r.join('\n'));
  await b.close();
})();
