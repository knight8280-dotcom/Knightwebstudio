const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 420 }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
    const r = await p.evaluate ? null : null;
    await p.screenshot({ path: __dirname + '/look/nojs-' + w + '.png', clip: { x: 0, y: 0, width: w, height: 260 } });
    await ctx.close();
  }
  await b.close();
})();
