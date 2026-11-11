// Smoke test in Firefox and WebKit, when they can be launched, with a screenshot of the page end in each:
//   PLAYWRIGHT_BROWSERS_PATH=<folder holding them> node other-browsers.js [outdir]
const pw = require('playwright');
const out = process.argv[2] || '../shots';
(async () => {
  for (const name of ['firefox', 'webkit']) {
    let b; try { b = await pw[name].launch(); } catch (e) { console.log(`SKIP  ${name}: cannot launch here (${String(e).split('\n')[0].slice(0, 90)})`); continue; }
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = [];
      p.on('console', m => { if (m.type() === 'error' && !/calendly|plausible|net::|NetworkError|Failed to load resource|blocked/i.test(m.text())) errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      await p.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html', { waitUntil: 'load' }); await p.waitForTimeout(700);
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); }); await p.waitForTimeout(900);
      const r = await p.evaluate(() => {
        const q = s => document.querySelector(s), bb = s => q(s).getBoundingClientRect();
        const name = bb('.kws-skyline-name'), art = bb('.kws-skyline-art'), sc = bb('.kws-skyline'), foot = bb('footer.kws-foot');
        const cols = [...document.querySelectorAll('.kws-foot-grid')].map(g => getComputedStyle(g).gridTemplateColumns.split(' ').length);
        const range = document.createRange(); range.selectNodeContents(q('.kws-skyline-name'));
        return { over: document.documentElement.scrollWidth - innerWidth, sceneAtBottom: Math.round(foot.bottom - sc.bottom), artH: Math.round(art.height), nameW: Math.round(range.getBoundingClientRect().width), nameY: Math.round(new DOMMatrix(getComputedStyle(q('.kws-skyline-name')).transform).m42), cols: cols.join('+'),
          bandBg: getComputedStyle(q('.kws-close')).backgroundImage.slice(0, 22), year: q('#year').textContent, cq: CSS.supports('width:1cqw'), sda: CSS.supports('animation-timeline:view()'), mix: CSS.supports('color', 'color-mix(in oklab, red, blue)') };
      });
      const ok = !errs.length && r.over <= 0 && r.sceneAtBottom === 0 && r.nameW <= w && r.nameW > w * .9 && r.nameY === 0;
      await p.screenshot({ path: `${out}/other-${name}-${w}.png` });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${b.version()} at ${w}px: page ${r.over}px wider than the screen; footer grids ${r.cols} columns; skyline ${r.artH}px, name ${r.nameW}px wide and at rest (${r.nameY}px) at the page end; container units ${r.cq}, scroll-linked rise ${r.sda}, colour mixing ${r.mix}; year ${r.year}${errs.length ? ' ERRORS ' + errs.join('|') : ''}`);
      await ctx.close();
    }
    await b.close();
  }
})();
