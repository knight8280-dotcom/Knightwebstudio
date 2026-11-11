const { chromium, BASE, PAGES, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch(); const rows = [];
  for (const [w, h, fs] of [[320, 256, 100], [320, 256, 150], [640, 400, 100], [568, 320, 100], [390, 664, 200], [844, 390, 100]]) for (const path of PAGES) { const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); if (fs !== 100) await p.addStyleTag({ content: `html{font-size:${fs}% !important}` }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const foot = document.getElementById('mobile-cta') && matchMedia('(max-width: 1099.98px)').matches ? 96 : 24; const rootH = innerHeight - foot; return [...document.querySelectorAll('.reveal')].filter(e => e.checkVisibility({ checkVisibilityCSS: true })).map(el => { const hh = el.getBoundingClientRect().height; return { el: el.tagName.toLowerCase() + '.' + el.className.replace(/\s+/g, '.').replace('.visible', ''), h: Math.round(hh), max: +(Math.min(hh, rootH) / hh).toFixed(3) }; }); });
    for (const x of r) rows.push(Object.assign({ vp: `${w}x${h}@${fs}%`, path }, x)); await ctx.close(); }
  rows.sort((a, b) => a.max - b.max); for (const x of rows.slice(0, 25)) console.log(JSON.stringify(x)); console.log('blocks that can never reach 0.08:', rows.filter(x => x.max < 0.08).length);
  await b.close(); })();
