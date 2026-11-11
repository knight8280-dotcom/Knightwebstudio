// Section heights at a given width.
const { chromium } = require('playwright');
(async () => {
  const w = parseInt(process.argv[2] || '390', 10), h = parseInt(process.argv[3] || '844', 10);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    const r = [];
    const add = (n, el) => { if (!el) return; const b = el.getBoundingClientRect(); r.push(n + ': top ' + Math.round(b.top + scrollY) + ' h ' + Math.round(b.height)); };
    add('topbar', document.querySelector('.topbar')); add('header', document.querySelector('.site-header'));
    document.querySelectorAll('main > section').forEach(s => add('section ' + (s.id || s.className), s));
    add('head-copy', document.querySelector('.head-copy')); add('h1', document.querySelector('h1')); add('lede', document.querySelector('.lede'));
    add('price-strip', document.querySelector('.price-strip')); add('points', document.querySelector('.points')); add('aside', document.querySelector('.page-head-aside'));
    add('menu', document.querySelector('.menu')); add('board', document.querySelector('.board')); add('prints', document.querySelector('.prints')); add('ticket', document.querySelector('.ticket'));
    add('footer', document.querySelector('.site-footer'));
    r.push('page: ' + document.documentElement.scrollHeight);
    return r;
  });
  console.log(out.join('\n'));
  await b.close();
})();
