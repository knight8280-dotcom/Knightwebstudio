// my own minimal reproduction: legend inside grid fieldset
const { webkit } = require(process.env.PWCORE);
(async () => {
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 700 } });
  const html = `<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><style>
  body{margin:8px;font:16px/1.3 sans-serif}
  fieldset{border:0;margin:0 0 16px;padding:0;min-width:0} legend{padding:0}
  .grid{display:grid;gap:8px}
  .full legend{width:100%}
  .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(176px,1fr));gap:16px}
  </style></head><body>
  <fieldset id=t1 class="grid full"><legend>What do you need? <span style="float:right">Optional, pick any</span></legend><div>one two three</div></fieldset>
  <fieldset id=t2 class="grid"><legend>What do you need?</legend><div>one two three</div></fieldset>
  <fieldset id=t3 class="full"><legend>What do you need?</legend><div>one two three</div></fieldset>
  <fieldset id=t4 class="cols full"><legend>Your business</legend><div>field a</div><div>field b</div></fieldset>
  <fieldset id=t5 class="cols"><legend>Your business</legend><div>field a</div><div>field b</div></fieldset>
  </body></html>`;
  const out = [];
  for (let i = 0; i < 4; i++) {
    await p.setContent(html); await p.waitForTimeout(250);
    out.push(await p.evaluate(() => ['t1','t2','t3','t4','t5'].map(id => { const f = document.getElementById(id); const l = f.querySelector('legend').getBoundingClientRect(); return `${id} ${Math.round(l.width)}x${Math.round(l.height)}/${Math.round(f.getBoundingClientRect().width)}x${Math.round(f.getBoundingClientRect().height)}`; }).join('  ')));
  }
  const ua = await p.evaluate(() => navigator.userAgent);
  console.log((ua.match(/Version\/[\d.]+/) || [ua])[0], b.version());
  for (const o of [...new Set(out)]) console.log('  ', o, 'x' + out.filter(x => x === o).length);
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '_' + process.env.PWLABEL + '.png' });
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 600)); process.exit(1); });
