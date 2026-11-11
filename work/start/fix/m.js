// Measures the head and the menu at many widths. node m.js [w,h ...]
const { chromium } = require('playwright');
const sizes = process.argv.slice(2).length ? process.argv.slice(2).map(s => s.split('x').map(Number)) : [[320,568],[360,640],[375,548],[390,664],[412,700],[430,740],[600,900],[620,900],[760,1000],[820,1100],[980,768],[1024,768],[1099,768],[1100,800],[1280,800],[1440,900],[1920,1080]];
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const q = s => document.querySelector(s), r = e => e.getBoundingClientRect(), R = Math.round;
      const lines = e => R(r(e).height / parseFloat(getComputedStyle(e).lineHeight));
      const h1 = q('h1');
      const col = r(q('.head-copy')).width;
      const lw = [...h1.querySelectorAll('.l')].map(l => { const rg = document.createRange(); rg.selectNodeContents(l); return R(rg.getBoundingClientRect().width); });
      const eb = q('.page-head .eyebrow');
      const btns = [...document.querySelectorAll('.page-head .btn')].map(e => [R(r(e).top), R(r(e).width)]);
      const cta = [...document.querySelectorAll('.cta-band .btn')].map(e => [R(r(e).top + scrollY), R(r(e).width)]);
      const rows = [...document.querySelectorAll('.pl-row')].map(row => { const n = row.querySelector('.pl-name'), pr = row.querySelector('.pl-price'), d = row.querySelector('.dots'); const wrapped = r(pr).top > r(n).bottom - 4; const dv = getComputedStyle(d).display !== 'none'; return (wrapped ? 'W' : '-') + (dv ? (wrapped ? '!' : R(r(d).width)) : 'x'); });
      const ledeRg = document.createRange(); ledeRg.selectNodeContents(q('.lede'));
      const ledeLines = [...new Set([...ledeRg.getClientRects()].map(x => R(x.top)))].length;
      return { col: R(col), h1px: parseFloat(getComputedStyle(h1).fontSize).toFixed(1), h1Lines: lines(h1), lw, ebLines: lines(eb), ebW: (() => { const rg = document.createRange(); rg.selectNodeContents(eb); return R(rg.getBoundingClientRect().width); })(), ledeLines, btns, call: R(r(document.querySelectorAll('.page-head .btn')[1]).bottom), nums: R(r(q('.price-strip-nums')).bottom), strip: R(r(q('.price-strip')).bottom), head: R(r(q('.page-head')).bottom), cta, rows: rows.join(' '), over: document.documentElement.scrollWidth - innerWidth, page: document.documentElement.scrollHeight };
    });
    console.log(w + 'x' + h, JSON.stringify(m));
    await ctx.close();
  }
  await b.close();
})();
