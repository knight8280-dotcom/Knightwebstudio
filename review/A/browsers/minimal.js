// Minimal case: is a legend's width wrong in a fieldset that is a grid container? No site CSS, no web fonts, no scripts.
const { webkit } = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await webkit.launch(); const p = await b.newPage({ viewport: { width: 390, height: 600 } });
  const html = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><style>
    fieldset{border:0;margin:0 0 20px;padding:0;min-width:0} legend{padding:0} .g{display:grid;gap:8px} .f{display:flex;flex-direction:column;gap:8px} .w legend{width:100%}
  </style>
  <fieldset id=a class="g w"><legend>What do you need? <span style="float:right">Optional</span></legend><div>chips</div></fieldset>
  <fieldset id=b class="g"><legend>What do you need?</legend><div>chips</div></fieldset>
  <fieldset id=c class="w"><legend>What do you need? <span style="float:right">Optional</span></legend><div>chips</div></fieldset>
  <fieldset id=d class="f w"><legend>What do you need?</legend><div>chips</div></fieldset>`;
  const runs = [];
  for (let i = 0; i < 3; i++) { await p.setContent(html); await p.waitForTimeout(300);
    runs.push(await p.evaluate(() => ['a', 'b', 'c', 'd'].map(id => { const f = document.getElementById(id), l = f.querySelector('legend').getBoundingClientRect(); return id + ':' + Math.round(l.width) + 'x' + Math.round(l.height) + ' in ' + Math.round(f.getBoundingClientRect().width); }).join('  '))); }
  console.log((await p.evaluate(() => navigator.userAgent.match(/Version\/[\d.]+/)[0])).padEnd(14), [...new Set(runs)].join('  ||  '));
  await b.close();
})();
