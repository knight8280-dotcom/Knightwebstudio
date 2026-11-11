const { launch, ctx, URL, PORT } = require('./common');
(async () => {
  const b = await launch();
  for (const [name, url] of [['demo', URL], ['portable', PORT]]) for (const w of [390, 1440]) {
    const c = await ctx(b, { viewport: { width: w, height: 900 }, javaScriptEnabled: false });
    const p = await c.newPage();
    await p.goto(url, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `nojs-${name}-${w}.png`, fullPage: true });
    // can't evaluate with JS disabled in page? Playwright evaluate still works via CDP (isolated). Try.
    let r;
    try {
      r = await p.evaluate(() => {
        const out = {};
        const vis = el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0 && r.width > 0 && r.height > 0; };
        out.folders = [...document.querySelectorAll('.kws-folder')].map(f => ({ id: f.id, vis: vis(f), h: Math.round(f.getBoundingClientRect().height), tabVis: f.querySelector('.kws-folder-tab') ? vis(f.querySelector('.kws-folder-tab')) : null }));
        out.marks = [...document.querySelectorAll('.kws-mark')].map(f => vis(f));
        out.canvases = document.querySelectorAll('canvas').length;
        out.motionBtn = [...document.querySelectorAll('.kws-motion')].map(vis);
        out.htmlClass = document.documentElement.className;
        out.scrollW = document.documentElement.scrollWidth; out.innerW = innerWidth;
        // clipped text: any element in kit with scrollWidth>clientWidth and overflow hidden
        out.clipped = [...document.querySelectorAll('[class*="kws-"]')].filter(e => { const cs = getComputedStyle(e); return /hidden|clip/.test(cs.overflow) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && e.textContent.trim(); }).map(e => e.className);
        out.shaders = [...document.querySelectorAll('.kws-shader')].map(s => ({ t: s.dataset.shader, w: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height), before: getComputedStyle(s, '::before').backgroundImage.slice(0, 60) }));
        return out;
      });
    } catch (e) { r = 'eval failed: ' + e.message; }
    console.log(name, w, JSON.stringify(r, null, 0));
    await c.close();
  }
  await b.close();
})();
