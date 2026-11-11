// Caption heights against the space the stylesheet holds for them, and the height before and after the script upgrades.
const chromium = require('/opt/node-tools/node_modules/playwright')[process.env.BROWSER || 'chromium'];
const URL = 'http://localhost:8730/kit/flat/demo.html';
(async () => {
  const b = await chromium.launch();
  const widths = process.argv[2] ? process.argv[2].split(',').map(Number) : [360, 375, 390, 414, 480, 560, 600, 680, 760, 820, 980, 1100, 1280, 1440, 1920];
  for (const w of widths) {
    const out = [];
    for (const mode of ['pre', 'live']) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
      if (mode === 'pre') await ctx.route(/\/(arc|spotlight)\.js/, r => r.abort());
      const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
      out.push(await p.evaluate(() => [...document.querySelectorAll('[data-kws]')].slice(0, 2).map(el => {
        const caps = [...el.querySelectorAll('[class$="-cap"]')];
        const need = caps.map(c => { const k = [...c.children]; const last = k[k.length - 1].getBoundingClientRect(); const cs = getComputedStyle(c); return Math.round(last.bottom - c.getBoundingClientRect().top - parseFloat(cs.paddingTop) + parseFloat(cs.paddingTop)); });
        return { h: Math.round(el.getBoundingClientRect().height * 10) / 10, held: parseFloat(getComputedStyle(caps[0]).minHeight), need: Math.max(...need), min: Math.min(...need) };
      })));
      await ctx.close();
    }
    const [pre, live] = out;
    console.log(String(w).padStart(5), ['arc', 'spot'].map((n, i) => `${n}: before ${pre[i].h} after ${live[i].h} ${pre[i].h === live[i].h ? 'same' : 'SHIFT ' + (live[i].h - pre[i].h).toFixed(1)} | caption needs ${live[i].min}-${live[i].need} of ${live[i].held}${live[i].need > live[i].held ? ' OVER' : ''}`).join('   '));
  }
  await b.close();
})();
