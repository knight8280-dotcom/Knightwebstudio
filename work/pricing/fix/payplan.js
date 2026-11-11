// Payment plan: is the deposit exactly half, do the two bars line up, and how much room does "month 1" have?
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const engine = process.argv[2] || 'chromium';
  const b = await pw[engine].launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  for (const w of [360, 390, 600, 760, 820, 980, 1000, 1024, 1100, 1280, 1440, 1920]) {
    await p.setViewportSize({ width: w, height: 900 });
    console.log(engine, w, JSON.stringify(await p.evaluate(() => {
      const bars = [...document.querySelectorAll('.payplan-bar')].filter(e => e.offsetParent);
      const plan = bars[bars.length - 1], segs = [...plan.children].map(e => e.getBoundingClientRect());
      const bar = plan.getBoundingClientRect();
      const std = bars.length > 1 ? bars[0].children[0].getBoundingClientRect() : null;
      const m = plan.children[1]; const range = document.createRange(); range.selectNodeContents(m.lastChild); const label = range.getBoundingClientRect();
      const oneRow = Math.abs(segs[0].top - segs[1].top) < 2;
      return { bar: Math.round(bar.width), deposit: Math.round(segs[0].width), months: segs.slice(1).map(s => Math.round(s.width)).join('+'), depositShare: oneRow ? +(100 * (segs[0].width + 2) / bar.width).toFixed(1) + '%' : 'own row', linesUpWithStandard: std ? Math.abs(std.right - segs[0].right) < 1 : 'standard hidden', monthLabel: Math.round(label.width), sideRoom: +((segs[1].width - label.width) / 2).toFixed(1) };
    })));
  }
  await b.close();
})();
