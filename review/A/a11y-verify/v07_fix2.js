const { chromium } = require('playwright');
const CSS = '.topbar-tel { padding-inline: var(--s-2); margin-inline: calc(-1 * var(--s-2)); } .topbar-tel:focus-visible { outline-offset: calc(-1 * var(--focus-w)); }';
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 360, 600, 820, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 600 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/', { waitUntil: 'load' });
    const before = await p.evaluate(() => { const t = document.querySelector('.topbar-tel').getBoundingClientRect(), pl = document.querySelector('.topbar-place').getBoundingClientRect(), tb = document.querySelector('.topbar').getBoundingClientRect(); return { telL: Math.round(t.left), telR: Math.round(t.right), placeR: Math.round(pl.right), h: Math.round(tb.height), sw: document.documentElement.scrollWidth }; });
    await p.addStyleTag({ content: CSS });
    const after = await p.evaluate(() => { const t = document.querySelector('.topbar-tel').getBoundingClientRect(), pl = document.querySelector('.topbar-place').getBoundingClientRect(), tb = document.querySelector('.topbar').getBoundingClientRect(); const txt = document.querySelector('.topbar-tel'); const range = document.createRange(); range.selectNodeContents(txt); const rr = range.getBoundingClientRect(); return { telL: Math.round(t.left), telR: Math.round(t.right), textL: Math.round(rr.left), textR: Math.round(rr.right), placeR: Math.round(pl.right), h: Math.round(tb.height), sw: document.documentElement.scrollWidth }; });
    console.log(w, 'before', JSON.stringify(before), 'after', JSON.stringify(after));
    await ctx.close();
  }
  await b.close();
})();
