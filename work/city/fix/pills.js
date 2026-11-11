// How the town labels wrap, per width: rows as counts. Optional CSS injected first.
const { chromium } = require('playwright');
(async () => {
  const css = process.argv[2] || '';
  const b = await chromium.launch();
  const p = await (await b.newContext()).newPage();
  for (const town of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    const out = [];
    for (const w of [360, 390, 430, 600, 760, 820, 900, 980, 1024, 1100, 1180, 1280, 1440, 1920]) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.goto(`http://localhost:8720/web-design-${town}/`); await p.evaluate(() => document.fonts.ready);
      if (css) await p.addStyleTag({ content: css });
      const rows = await p.evaluate(() => { const m = new Map(); for (const li of document.querySelectorAll('.pills li')) { const r = li.getBoundingClientRect(); const t = Math.round((r.top + r.height / 2) / 16); m.set(t, (m.get(t) || 0) + 1); } return [...m.values()].join('+') + ' h' + Math.round(document.querySelector('.pills').getBoundingClientRect().height); });
      out.push(w + ':' + rows);
    }
    console.log(town.padEnd(15), out.join('  '));
  }
  await b.close();
})();
