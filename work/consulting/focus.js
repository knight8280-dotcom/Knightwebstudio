const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, theme] of [[390, 'light'], [1440, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, colorScheme: theme, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(400);
    await p.addStyleTag({ content: '#mobile-cta, .site-header { display: none !important; }' });
    await p.focus('#c-rate'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); // lands on c-callwin via keyboard
    const id = await p.evaluate(() => document.activeElement.id);
    const el = await p.$('#c-callwin'); const box = await el.boundingBox();
    await p.screenshot({ path: __dirname + '/sec/focus-' + w + '-' + theme + '.png', clip: { x: Math.max(0, box.x - 220), y: box.y - 30, width: Math.min(w, box.width + 300), height: box.height + 60 } });
    console.log(w, theme, 'focused', id);
    await ctx.close();
  }
  await b.close();
})();
