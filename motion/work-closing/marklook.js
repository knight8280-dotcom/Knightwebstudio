const eng = process.argv[2];
if (eng !== 'chromium') process.env.PLAYWRIGHT_BROWSERS_PATH = __dirname + '/../.browsers-flat';
const pw = require('playwright');
(async () => {
  const b = await pw[eng].launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.route('**/shader.js', r => r.abort());
  await p.goto('http://localhost:8730/kit/closing/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  let i = 0;
  for (const [w, title] of [[350, 'Still deciding? Book the <span class="kws-close-mark"><span>free call</span>.</span>'], [360, 'Ready when you are: get <span class="kws-close-mark"><span>your free estimate</span>.</span>'], [360, 'Book <span class="kws-close-mark"><span>a free thirty-minute call</span>,</span> today.'], [390, 'Get <span class="kws-close-mark"><span>your quote</span></span> by Friday.']]) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.evaluate(t => { document.querySelector('#close-sign').innerHTML = t; }, title);
    const el = p.locator('#close-sign'); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    const bb = await el.boundingBox();
    await p.screenshot({ path: `ob/mark-${eng}-${i++}.png`, clip: { x: 0, y: bb.y - 16, width: w, height: bb.height + 40 } });
  }
  await b.close();
})();
