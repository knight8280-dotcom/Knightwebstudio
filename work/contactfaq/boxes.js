// node boxes.js URL [width] [depth] : outline of main with tops and heights
const { chromium } = require('playwright');
(async () => {
  const [url, w = '390', depth = '4'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: 844 }, isMobile: +w < 700, hasTouch: +w < 700 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const out = await p.evaluate((depth) => {
    const lines = ['page ' + document.documentElement.scrollHeight];
    const walk = (e, d) => {
      if (d > depth) return;
      for (const c of e.children) {
        const cs = getComputedStyle(c); if (cs.display === 'none') continue;
        const r = c.getBoundingClientRect();
        lines.push('  '.repeat(d) + c.tagName.toLowerCase() + (c.id ? '#' + c.id : '') + (c.className && typeof c.className === 'string' ? '.' + c.className.split(' ').slice(0, 2).join('.') : '') + '  top ' + Math.round(r.top + scrollY) + '  h ' + Math.round(r.height) + '  w ' + Math.round(r.width) + '  ' + (c.children.length ? '' : JSON.stringify((c.textContent || '').trim().slice(0, 30))));
        walk(c, d + 1);
      }
    };
    walk(document.querySelector('main'), 0);
    return lines.join('\n');
  }, +depth);
  console.log(out);
  await b.close();
})();
