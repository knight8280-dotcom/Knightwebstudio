const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, name] of [[1280, 'd'], [390, 'm']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: 'light' });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8721/'); await p.waitForTimeout(600);
    for (const id of ['prose', 'toc', 'receipt', 'ticket', 'buttons']) {
      const h = await p.$('#' + id);
      const sec = await h.evaluateHandle(el => el.closest('section') || el.parentElement);
      await sec.asElement().screenshot({ path: `${process.argv[2]}/${id}-${name}.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
