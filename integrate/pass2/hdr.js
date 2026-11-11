// Header rows on emulated phones, default text, 150% text, and WCAG text spacing; also with the web fonts blocked (fallback faces).
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  for (const mode of ['default', 'nofont', 'text150', 'text125', 'spacing']) {
    for (const path of ['/', '/start/', '/404.html']) {
      const out = [];
      for (const w of [320, 324, 328, 330, 332, 336, 340, 350, 360, 375, 379, 380, 390, 600, 820, 1099, 1100, 1280, 1400]) {
        if (mode !== 'default' && mode !== 'nofont' && ![320, 360, 390, 600, 820, 1100, 1280, 1400].includes(w)) continue;
        const ctx = await b.newContext({ viewport: { width: w, height: 700 }, isMobile: w < 1000, hasTouch: w < 1000, deviceScaleFactor: 2 });
        await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
        if (mode === 'nofont') await ctx.route(/\.woff2/, r => r.abort());
        const p = await ctx.newPage();
        await p.goto(BASE + path);
        if (mode === 'text150') await p.addStyleTag({ content: 'html{font-size:150%}' });
        if (mode === 'text125') await p.addStyleTag({ content: 'html{font-size:125%}' });
        if (mode === 'spacing') await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}' });
        await p.waitForTimeout(250);
        const r = await p.evaluate(() => {
          const hi = document.querySelector('.header-inner').getBoundingClientRect();
          const a = document.querySelector('.header-actions');
          const ar = a ? a.getBoundingClientRect() : null;
          const br = document.querySelector('.site-header .brand').getBoundingClientRect();
          const crest = document.querySelector('.site-header .crest').getBoundingClientRect();
          let clipped = [];
          for (const e of document.querySelectorAll('.site-header .brand, .site-header .header-actions > *, .site-header .nav-links a')) {
            const q = e.getBoundingClientRect(); const cs = getComputedStyle(e);
            if (!q.width || cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (e.closest('.nav') && innerWidth < 1100) continue;
            if (q.right > document.documentElement.clientWidth + .5 || q.left < -.5) clipped.push((e.className || e.tagName) + ':' + Math.round(q.left) + '-' + Math.round(q.right));
          }
          return { h: Math.round(hi.height), brandR: Math.round(br.right), crest: Math.round(crest.width), aL: ar && Math.round(ar.left), aR: ar && Math.round(ar.right), aTop: ar && Math.round(ar.top - hi.top), cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, clipped };
        });
        out.push(`${w}: h${r.h} crest${r.crest} brandR${r.brandR} actions ${r.aL}-${r.aR}@${r.aTop}${r.sw > r.cw ? ' OVERFLOW ' + r.sw : ''}${r.clipped.length ? ' CLIPPED ' + r.clipped.join(',') : ''}`);
        await ctx.close();
      }
      console.log(`[${mode}] ${path}\n   ` + out.join('\n   '));
    }
  }
  await b.close();
})();
