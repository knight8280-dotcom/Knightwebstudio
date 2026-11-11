const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  for (const [name, base] of [['prefold', 'http://localhost:8722'], ['repo', 'http://localhost:8720']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await block(ctx); const p = await ctx.newPage();
    for (const id of ['growth-consulting', 'seo', 'google-reviews']) {
      await p.goto(base + '/services/#' + id); await p.waitForTimeout(1200);
      console.log(name, id, JSON.stringify(await p.evaluate(i => { const e = document.getElementById(i); const d = e.closest('details'); const r = e.getBoundingClientRect(); const s = d.querySelector('summary').getBoundingClientRect(); return { open: d.open, top: Math.round(r.top), summaryTop: Math.round(s.top), scrollY: Math.round(scrollY), vh: innerHeight, tag: e.tagName + '.' + e.className }; }, id)));
    }
    for (const w of [320, 330, 340, 360]) { await p.setViewportSize({ width: w, height: 700 }); await p.goto(base + '/pricing/'); await p.waitForTimeout(200);
      console.log(name, w, JSON.stringify(await p.evaluate(() => { const hi = document.querySelector('.header-inner'); const a = document.querySelector('.header-actions').getBoundingClientRect(); const br = document.querySelector('.brand').getBoundingClientRect(); return { headerH: Math.round(hi.getBoundingClientRect().height), actionsRight: Math.round(a.right), actionsTop: Math.round(a.top - hi.getBoundingClientRect().top), brandW: Math.round(br.width), docW: document.documentElement.scrollWidth, inner: innerWidth }; })));
    }
    await ctx.close();
  }
  await b.close();
})();
