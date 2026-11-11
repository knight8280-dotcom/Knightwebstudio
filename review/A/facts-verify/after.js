const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, javaScriptEnabled: false }); const page = await ctx.newPage();
    for (const [name, base] of [['now', 'http://localhost:8720'], ['fixed', 'http://localhost:8731']]) {
      await page.goto(base + '/'); const l = page.locator('.stop-sum .note');
      await l.screenshot({ path: `home-note-${w}-${name}.png` });
      console.log(w, name, JSON.stringify(await l.boundingBox()), JSON.stringify((await l.innerText()).slice(0, 30)));
    }
    await ctx.close();
  }
  await b.close();
})();
