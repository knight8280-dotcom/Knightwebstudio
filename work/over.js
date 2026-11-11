const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(process.argv[2]); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > innerWidth + 1) out.push(el.tagName + '.' + el.className + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width) + ' pos=' + getComputedStyle(el).position); } return out.slice(0, 12).join('\n') + '\nscrollW ' + document.documentElement.scrollWidth; }));
  await b.close(); })();
