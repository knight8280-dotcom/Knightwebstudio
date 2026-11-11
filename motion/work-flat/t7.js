const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const res = { tile: 0, link: 0, frame: 0 };
  for (let k = 0; k < 8; k++) for (const [what, sel] of [['tile', '#services .kws-arc li.is-on .kws-arc-tile'], ['link', '#services .kws-arc li.is-on .kws-arc-link'], ['frame', '#work .kws-spot li.is-on .kws-spot-frame']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
    await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(350);
    await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
    const m = await p.locator(sel).boundingBox();
    await p.keyboard.down('Control');
    const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null), p.mouse.click(m.x + m.width / 2, m.y + m.height / 2)]);
    await p.keyboard.up('Control');
    if (popup) res[what]++; else console.log(what, 'no popup; url', p.url().replace(/^.*8730/, ''), 'pages', ctx.pages().length);
    await ctx.close();
  }
  console.log(JSON.stringify(res), 'of 8 each');
  await b.close();
})();
