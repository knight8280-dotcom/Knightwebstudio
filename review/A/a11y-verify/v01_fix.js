// A11Y-01: test the proposed observer options by serving a patched main.js (the repository is not touched).
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8720';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
const src = fs.readFileSync('/home/user/Knightwebstudio/assets/js/main.js', 'utf8');
const OLD = "{ threshold: 0.08, rootMargin: '0px 0px -' + revealFoot + 'px 0px' }";
if (!src.includes(OLD)) { console.log('observer options not found as expected'); process.exit(1); }
const VARIANTS = {
  shipped: src,
  reviewer: src.replace(OLD, "{ threshold: 0, rootMargin: '0px 0px -12% 0px' }"),
};
const which = (process.argv[2] || 'shipped,reviewer').split(',');
const SIZES = (process.argv[3] || '341x162,320x150,390x844,1280x800').split(',').map(s => s.split('x').map(Number));
const PAGES = (process.argv[4] || '/pricing/,/consulting/,/about/,/').split(',');
(async () => {
  const b = await chromium.launch();
  for (const v of which) for (const [w, h] of SIZES) for (const path of PAGES) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(BLOCK, r => r.abort());
    await ctx.route(/\/assets\/js\/main\.js/, r => r.fulfill({ contentType: 'application/javascript', body: VARIANTS[v] }));
    const p = await ctx.newPage();
    await p.goto(BASE + path, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    // at load: how many blocks wholly below the fold are already shown (they should wait)
    const early = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(el => el.getBoundingClientRect().top > innerHeight + 50 && el.classList.contains('visible')).length);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.max(60, Math.floor(h / 2));
    for (let y = 0; y <= total; y += step) { await p.evaluate(yy => window.scrollTo(0, yy), y); await p.waitForTimeout(20); }
    await p.waitForTimeout(600);
    const res = await p.evaluate(() => { const all = [...document.querySelectorAll('.reveal')]; return { n: all.length, hidden: all.filter(el => !el.classList.contains('visible') || getComputedStyle(el).opacity === '0').map(el => el.tagName.toLowerCase() + '.' + el.className.split(' ')[0] + ' ' + Math.round(el.getBoundingClientRect().height) + 'px') }; });
    console.log(`${v} ${w}x${h} ${path}: never shown ${res.hidden.length} of ${res.n}; shown early below the fold ${early}` + (res.hidden.length ? '  ' + res.hidden.join(', ') : ''));
    await ctx.close();
  }
  await b.close();
})();
