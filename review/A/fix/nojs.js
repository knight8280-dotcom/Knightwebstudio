// Scripts off: edited regions are visible (opacity 1, not hidden) and legends full width
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const w of [390, 1280]) for (const [path, sel] of [['/', '.board'], ['/pricing/', '#care'], ['/contact/', 'fieldset.field'], ['/consulting/', '.calc-inputs']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    const r = await p.evaluate(s => { const el = document.querySelector(s); const hidden = [el, ...el.querySelectorAll('*')].filter(e => { const c = getComputedStyle(e); return c.opacity === '0' || c.visibility === 'hidden'; }).length; const lg = [...el.querySelectorAll('legend')].map(l => Math.round(l.getBoundingClientRect().width)).join(','); return `js=${document.documentElement.classList.contains('js')} hidden=${hidden} legends=${lg || '-'} h=${Math.round(el.offsetHeight)}`; }, sel);
    if (w === 390) { await (await p.$(sel)).screenshot({ path: `nojs_${path.replace(/\//g, '') || 'home'}_${w}.png` }); }
    console.log(w, path, sel, r); await ctx.close(); }
  await b.close(); })();
