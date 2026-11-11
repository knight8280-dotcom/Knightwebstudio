// Natural height of each story card's parts (script off, so nothing is stretched), at a given width.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of (process.argv[2] || '390,1440').split(',').map(Number)) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/depth/demo.html'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const el = document.querySelector('.kws-cyl'); document.documentElement.classList.add('js');
      return [...el.querySelectorAll('.kws-cyl-card')].map(c => { const a = c.querySelector('.kws-cyl-art'); a.style.flex = 'none'; a.style.minHeight = '0';
        return { card: c.offsetWidth, tag: c.querySelector('.kws-cyl-tag').offsetHeight, title: c.querySelector('.kws-cyl-title').offsetHeight, art: a.offsetHeight, mock: a.lastElementChild.offsetHeight, text: c.querySelector('.kws-cyl-text').offsetHeight }; }); });
    console.log(w, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
