const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 360, height: 740 } }); const p = await c.newPage();
  await p.goto('http://localhost:8720/process/'); await p.waitForTimeout(300);
  console.log(JSON.stringify(await p.evaluate(() => { const d = document.querySelectorAll('.steps dl div')[2]; const r = e => Math.round(e.getBoundingClientRect().width * 10) / 10;
    const a = getComputedStyle(d, '::after'); const t = document.querySelector('.ticket');
    return { div: r(d), dt: r(d.children[0]), dd: r(d.children[1]), afterMin: a.minWidth, afterW: a.width, flex: a.flex, gap: getComputedStyle(d).gap, ticketPad: getComputedStyle(t).paddingLeft, ticket: r(t), ddWrap: getComputedStyle(d).flexWrap }; })));
  await b.close(); })();
